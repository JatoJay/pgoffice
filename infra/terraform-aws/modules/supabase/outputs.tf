output "supabase_url" {
  description = "Supabase API URL"
  value       = "http://${aws_lb.supabase.dns_name}"
}

output "supabase_studio_url" {
  description = "Supabase Studio URL"
  value       = "http://${aws_lb.supabase.dns_name}/studio"
}

output "supabase_anon_key" {
  description = "Supabase anonymous key"
  value       = var.anon_key
  sensitive   = true
}

output "supabase_alb_dns_name" {
  description = "Supabase ALB DNS name"
  value       = aws_lb.supabase.dns_name
}

output "supabase_security_group_id" {
  description = "Supabase tasks security group ID"
  value       = aws_security_group.supabase_tasks.id
}
