variable "project" {
  description = "Project name"
  type        = string
  default     = "pgoffice"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "web_task_cpu" {
  description = "Web task CPU units"
  type        = number
  default     = 256
}

variable "web_task_memory" {
  description = "Web task memory in MB"
  type        = number
  default     = 512
}

variable "api_task_cpu" {
  description = "API task CPU units"
  type        = number
  default     = 256
}

variable "api_task_memory" {
  description = "API task memory in MB"
  type        = number
  default     = 512
}

variable "web_desired_count" {
  description = "Desired number of web tasks"
  type        = number
  default     = 2
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto-scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "pgoffice"
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "supabase_jwt_secret" {
  description = "Supabase JWT secret (min 32 chars)"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "supabase_dashboard_username" {
  description = "Supabase Studio dashboard username"
  type        = string
  default     = "admin"
}

variable "supabase_dashboard_password" {
  description = "Supabase Studio dashboard password"
  type        = string
  sensitive   = true
}
