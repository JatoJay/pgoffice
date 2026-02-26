terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

module "vpc" {
  source = "./modules/vpc"

  project            = var.project
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

module "ecr" {
  source = "./modules/ecr"

  project     = var.project
  environment = var.environment
}

module "rds" {
  source = "./modules/rds"

  project               = var.project
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  db_instance_class     = var.db_instance_class
  db_allocated_storage  = var.db_allocated_storage
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  ecs_security_group_id = module.ecs.ecs_tasks_security_group_id
}

module "alb" {
  source = "./modules/alb"

  project           = var.project
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.certificate_arn
  health_check_path = "/api/health"
}

module "ecs" {
  source = "./modules/ecs"

  project               = var.project
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  alb_security_group_id = module.alb.alb_security_group_id

  web_ecr_repository_url = module.ecr.web_repository_url
  api_ecr_repository_url = module.ecr.api_repository_url
  image_tag              = var.image_tag

  web_container_port = 3000
  api_container_port = 3001

  web_target_group_arn = module.alb.web_target_group_arn
  api_target_group_arn = module.alb.api_target_group_arn

  web_task_cpu    = var.web_task_cpu
  web_task_memory = var.web_task_memory
  api_task_cpu    = var.api_task_cpu
  api_task_memory = var.api_task_memory

  web_desired_count = var.web_desired_count
  api_desired_count = var.api_desired_count
  min_capacity      = var.min_capacity
  max_capacity      = var.max_capacity

  supabase_url      = module.supabase.supabase_url
  supabase_anon_key = module.supabase.supabase_anon_key
  database_url      = module.rds.database_url

  depends_on = [module.alb]
}

module "supabase" {
  source = "./modules/supabase"

  project            = var.project
  environment        = var.environment
  aws_region         = var.aws_region
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  database_host     = module.rds.database_host
  database_port     = module.rds.database_port
  database_name     = var.db_name
  database_user     = var.db_username
  database_password = var.db_password

  jwt_secret         = var.supabase_jwt_secret
  anon_key           = var.supabase_anon_key
  service_role_key   = var.supabase_service_role_key
  dashboard_username = var.supabase_dashboard_username
  dashboard_password = var.supabase_dashboard_password

  ecs_cluster_id              = module.ecs.cluster_id
  ecs_cluster_name            = module.ecs.cluster_name
  ecs_execution_role_arn      = module.ecs.execution_role_arn
  ecs_task_role_arn           = module.ecs.task_role_arn
  ecs_tasks_security_group_id = module.ecs.ecs_tasks_security_group_id
}
