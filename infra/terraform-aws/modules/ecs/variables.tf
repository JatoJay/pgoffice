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

variable "alb_security_group_id" {
  type = string
}

variable "web_ecr_repository_url" {
  type = string
}

variable "api_ecr_repository_url" {
  type = string
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "web_container_port" {
  type    = number
  default = 3000
}

variable "api_container_port" {
  type    = number
  default = 3001
}

variable "web_target_group_arn" {
  type = string
}

variable "api_target_group_arn" {
  type = string
}

variable "web_task_cpu" {
  type    = number
  default = 256
}

variable "web_task_memory" {
  type    = number
  default = 512
}

variable "api_task_cpu" {
  type    = number
  default = 256
}

variable "api_task_memory" {
  type    = number
  default = 512
}

variable "web_desired_count" {
  type    = number
  default = 2
}

variable "api_desired_count" {
  type    = number
  default = 2
}

variable "min_capacity" {
  type    = number
  default = 1
}

variable "max_capacity" {
  type    = number
  default = 10
}

variable "supabase_url" {
  type = string
}

variable "supabase_anon_key" {
  type      = string
  sensitive = true
}

variable "database_url" {
  type      = string
  sensitive = true
}
