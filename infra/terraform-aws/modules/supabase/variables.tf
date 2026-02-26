variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "database_host" {
  type = string
}

variable "database_port" {
  type    = number
  default = 5432
}

variable "database_name" {
  type = string
}

variable "database_user" {
  type      = string
  sensitive = true
}

variable "database_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "anon_key" {
  type      = string
  sensitive = true
}

variable "service_role_key" {
  type      = string
  sensitive = true
}

variable "dashboard_username" {
  type    = string
  default = "admin"
}

variable "dashboard_password" {
  type      = string
  sensitive = true
}

variable "ecs_cluster_id" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_execution_role_arn" {
  type = string
}

variable "ecs_task_role_arn" {
  type = string
}

variable "ecs_tasks_security_group_id" {
  type = string
}
