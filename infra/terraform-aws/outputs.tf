output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "web_ecr_repository_url" {
  description = "Web ECR repository URL"
  value       = module.ecr.web_repository_url
}

output "api_ecr_repository_url" {
  description = "API ECR repository URL"
  value       = module.ecr.api_repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.database_host
  sensitive   = true
}

output "supabase_url" {
  description = "Supabase API URL"
  value       = module.supabase.supabase_url
}

output "supabase_studio_url" {
  description = "Supabase Studio URL"
  value       = module.supabase.supabase_studio_url
}
