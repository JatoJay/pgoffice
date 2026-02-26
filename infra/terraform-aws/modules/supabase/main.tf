locals {
  supabase_api_port    = 8000
  supabase_studio_port = 3000
  supabase_auth_port   = 9999
  supabase_rest_port   = 3000
  supabase_realtime_port = 4000
  supabase_meta_port   = 8080
}

resource "aws_cloudwatch_log_group" "supabase" {
  name              = "/ecs/${var.project}-${var.environment}/supabase"
  retention_in_days = 30

  tags = {
    Name = "${var.project}-${var.environment}-supabase"
  }
}

resource "aws_lb" "supabase" {
  name               = "${var.project}-supabase-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.supabase_alb.id]
  subnets            = var.public_subnet_ids

  tags = {
    Name = "${var.project}-supabase-${var.environment}"
  }
}

resource "aws_security_group" "supabase_alb" {
  name        = "${var.project}-supabase-alb-${var.environment}"
  description = "Security group for Supabase ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-supabase-alb-${var.environment}"
  }
}

resource "aws_security_group" "supabase_tasks" {
  name        = "${var.project}-supabase-tasks-${var.environment}"
  description = "Security group for Supabase ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "From ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.supabase_alb.id]
  }

  ingress {
    description     = "From ECS Tasks"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [var.ecs_tasks_security_group_id]
  }

  ingress {
    description = "Inter-service communication"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-supabase-tasks-${var.environment}"
  }
}

resource "aws_lb_target_group" "kong" {
  name        = "${var.project}-kong-${var.environment}"
  port        = local.supabase_api_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  tags = {
    Name = "${var.project}-kong-${var.environment}"
  }
}

resource "aws_lb_target_group" "studio" {
  name        = "${var.project}-studio-${var.environment}"
  port        = local.supabase_studio_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  tags = {
    Name = "${var.project}-studio-${var.environment}"
  }
}

resource "aws_lb_listener" "supabase_http" {
  load_balancer_arn = aws_lb.supabase.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.kong.arn
  }
}

resource "aws_lb_listener_rule" "studio" {
  listener_arn = aws_lb_listener.supabase_http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.studio.arn
  }

  condition {
    path_pattern {
      values = ["/studio", "/studio/*"]
    }
  }
}

resource "aws_service_discovery_private_dns_namespace" "supabase" {
  name        = "supabase.local"
  description = "Service discovery for Supabase services"
  vpc         = var.vpc_id
}

resource "aws_service_discovery_service" "kong" {
  name = "kong"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.supabase.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "auth" {
  name = "auth"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.supabase.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "rest" {
  name = "rest"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.supabase.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "realtime" {
  name = "realtime"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.supabase.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "meta" {
  name = "meta"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.supabase.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "storage" {
  name = "storage"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.supabase.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_ecs_task_definition" "kong" {
  family                   = "${var.project}-${var.environment}-kong"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "kong"
      image     = "kong:2.8.1"
      essential = true

      portMappings = [
        {
          containerPort = local.supabase_api_port
          hostPort      = local.supabase_api_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "KONG_DATABASE", value = "off" },
        { name = "KONG_DECLARATIVE_CONFIG", value = "/var/lib/kong/kong.yml" },
        { name = "KONG_DNS_ORDER", value = "LAST,A,CNAME" },
        { name = "KONG_PLUGINS", value = "request-transformer,cors,key-auth,acl" },
        { name = "KONG_NGINX_PROXY_PROXY_BUFFER_SIZE", value = "160k" },
        { name = "KONG_NGINX_PROXY_PROXY_BUFFERS", value = "64 160k" },
        { name = "SUPABASE_ANON_KEY", value = var.anon_key },
        { name = "SUPABASE_SERVICE_KEY", value = var.service_role_key }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.supabase.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "kong"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project}-${var.environment}-kong"
  }
}

resource "aws_ecs_task_definition" "auth" {
  family                   = "${var.project}-${var.environment}-auth"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "auth"
      image     = "supabase/gotrue:v2.132.3"
      essential = true

      portMappings = [
        {
          containerPort = local.supabase_auth_port
          hostPort      = local.supabase_auth_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "GOTRUE_API_HOST", value = "0.0.0.0" },
        { name = "GOTRUE_API_PORT", value = tostring(local.supabase_auth_port) },
        { name = "API_EXTERNAL_URL", value = "http://${aws_lb.supabase.dns_name}" },
        { name = "GOTRUE_DB_DRIVER", value = "postgres" },
        { name = "GOTRUE_DB_DATABASE_URL", value = "postgresql://${var.database_user}:${var.database_password}@${var.database_host}:${var.database_port}/${var.database_name}?search_path=auth" },
        { name = "GOTRUE_SITE_URL", value = "http://${aws_lb.supabase.dns_name}" },
        { name = "GOTRUE_URI_ALLOW_LIST", value = "" },
        { name = "GOTRUE_DISABLE_SIGNUP", value = "false" },
        { name = "GOTRUE_JWT_ADMIN_ROLES", value = "service_role" },
        { name = "GOTRUE_JWT_AUD", value = "authenticated" },
        { name = "GOTRUE_JWT_DEFAULT_GROUP_NAME", value = "authenticated" },
        { name = "GOTRUE_JWT_EXP", value = "3600" },
        { name = "GOTRUE_JWT_SECRET", value = var.jwt_secret },
        { name = "GOTRUE_EXTERNAL_EMAIL_ENABLED", value = "true" },
        { name = "GOTRUE_MAILER_AUTOCONFIRM", value = "true" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.supabase.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "auth"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project}-${var.environment}-auth"
  }
}

resource "aws_ecs_task_definition" "rest" {
  family                   = "${var.project}-${var.environment}-rest"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "rest"
      image     = "postgrest/postgrest:v12.0.1"
      essential = true

      portMappings = [
        {
          containerPort = local.supabase_rest_port
          hostPort      = local.supabase_rest_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "PGRST_DB_URI", value = "postgresql://${var.database_user}:${var.database_password}@${var.database_host}:${var.database_port}/${var.database_name}" },
        { name = "PGRST_DB_SCHEMAS", value = "public,storage,graphql_public" },
        { name = "PGRST_DB_ANON_ROLE", value = "anon" },
        { name = "PGRST_JWT_SECRET", value = var.jwt_secret },
        { name = "PGRST_DB_USE_LEGACY_GUCS", value = "false" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.supabase.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "rest"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project}-${var.environment}-rest"
  }
}

resource "aws_ecs_task_definition" "realtime" {
  family                   = "${var.project}-${var.environment}-realtime"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "realtime"
      image     = "supabase/realtime:v2.25.35"
      essential = true

      portMappings = [
        {
          containerPort = local.supabase_realtime_port
          hostPort      = local.supabase_realtime_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "PORT", value = tostring(local.supabase_realtime_port) },
        { name = "DB_HOST", value = var.database_host },
        { name = "DB_PORT", value = tostring(var.database_port) },
        { name = "DB_USER", value = "supabase_admin" },
        { name = "DB_PASSWORD", value = var.database_password },
        { name = "DB_NAME", value = var.database_name },
        { name = "DB_AFTER_CONNECT_QUERY", value = "SET search_path TO _realtime" },
        { name = "DB_ENC_KEY", value = "supabaserealtime" },
        { name = "API_JWT_SECRET", value = var.jwt_secret },
        { name = "FLY_ALLOC_ID", value = "fly123" },
        { name = "FLY_APP_NAME", value = "realtime" },
        { name = "SECRET_KEY_BASE", value = var.jwt_secret },
        { name = "ERL_AFLAGS", value = "-proto_dist inet_tcp" },
        { name = "ENABLE_TAILSCALE", value = "false" },
        { name = "DNS_NODES", value = "''" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.supabase.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "realtime"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project}-${var.environment}-realtime"
  }
}

resource "aws_ecs_task_definition" "storage" {
  family                   = "${var.project}-${var.environment}-storage"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "storage"
      image     = "supabase/storage-api:v0.43.11"
      essential = true

      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "ANON_KEY", value = var.anon_key },
        { name = "SERVICE_KEY", value = var.service_role_key },
        { name = "POSTGREST_URL", value = "http://rest.supabase.local:${local.supabase_rest_port}" },
        { name = "PGRST_JWT_SECRET", value = var.jwt_secret },
        { name = "DATABASE_URL", value = "postgresql://${var.database_user}:${var.database_password}@${var.database_host}:${var.database_port}/${var.database_name}" },
        { name = "FILE_SIZE_LIMIT", value = "52428800" },
        { name = "STORAGE_BACKEND", value = "file" },
        { name = "FILE_STORAGE_BACKEND_PATH", value = "/var/lib/storage" },
        { name = "TENANT_ID", value = "stub" },
        { name = "REGION", value = var.aws_region },
        { name = "GLOBAL_S3_BUCKET", value = "stub" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.supabase.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "storage"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project}-${var.environment}-storage"
  }
}

resource "aws_ecs_task_definition" "meta" {
  family                   = "${var.project}-${var.environment}-meta"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "meta"
      image     = "supabase/postgres-meta:v0.75.0"
      essential = true

      portMappings = [
        {
          containerPort = local.supabase_meta_port
          hostPort      = local.supabase_meta_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "PG_META_PORT", value = tostring(local.supabase_meta_port) },
        { name = "PG_META_DB_HOST", value = var.database_host },
        { name = "PG_META_DB_PORT", value = tostring(var.database_port) },
        { name = "PG_META_DB_NAME", value = var.database_name },
        { name = "PG_META_DB_USER", value = var.database_user },
        { name = "PG_META_DB_PASSWORD", value = var.database_password }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.supabase.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "meta"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project}-${var.environment}-meta"
  }
}

resource "aws_ecs_task_definition" "studio" {
  family                   = "${var.project}-${var.environment}-studio"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "studio"
      image     = "supabase/studio:20240101-8e4a094"
      essential = true

      portMappings = [
        {
          containerPort = local.supabase_studio_port
          hostPort      = local.supabase_studio_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "STUDIO_PG_META_URL", value = "http://meta.supabase.local:${local.supabase_meta_port}" },
        { name = "POSTGRES_PASSWORD", value = var.database_password },
        { name = "DEFAULT_ORGANIZATION_NAME", value = var.project },
        { name = "DEFAULT_PROJECT_NAME", value = var.project },
        { name = "SUPABASE_URL", value = "http://kong.supabase.local:${local.supabase_api_port}" },
        { name = "SUPABASE_PUBLIC_URL", value = "http://${aws_lb.supabase.dns_name}" },
        { name = "SUPABASE_ANON_KEY", value = var.anon_key },
        { name = "SUPABASE_SERVICE_KEY", value = var.service_role_key },
        { name = "LOGFLARE_API_KEY", value = "your-super-secret-and-long-logflare-key" },
        { name = "LOGFLARE_URL", value = "http://localhost:4000" },
        { name = "NEXT_PUBLIC_ENABLE_LOGS", value = "false" },
        { name = "NEXT_ANALYTICS_BACKEND_PROVIDER", value = "postgres" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.supabase.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "studio"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project}-${var.environment}-studio"
  }
}

resource "aws_ecs_service" "kong" {
  name                               = "${var.project}-${var.environment}-kong"
  cluster                            = var.ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.kong.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.supabase_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.kong.arn
    container_name   = "kong"
    container_port   = local.supabase_api_port
  }

  service_registries {
    registry_arn = aws_service_discovery_service.kong.arn
  }

  tags = {
    Name = "${var.project}-${var.environment}-kong"
  }
}

resource "aws_ecs_service" "auth" {
  name                               = "${var.project}-${var.environment}-auth"
  cluster                            = var.ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.auth.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.supabase_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.auth.arn
  }

  tags = {
    Name = "${var.project}-${var.environment}-auth"
  }
}

resource "aws_ecs_service" "rest" {
  name                               = "${var.project}-${var.environment}-rest"
  cluster                            = var.ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.rest.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.supabase_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.rest.arn
  }

  tags = {
    Name = "${var.project}-${var.environment}-rest"
  }
}

resource "aws_ecs_service" "realtime" {
  name                               = "${var.project}-${var.environment}-realtime"
  cluster                            = var.ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.realtime.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.supabase_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.realtime.arn
  }

  tags = {
    Name = "${var.project}-${var.environment}-realtime"
  }
}

resource "aws_ecs_service" "storage" {
  name                               = "${var.project}-${var.environment}-storage"
  cluster                            = var.ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.storage.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.supabase_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.storage.arn
  }

  tags = {
    Name = "${var.project}-${var.environment}-storage"
  }
}

resource "aws_ecs_service" "meta" {
  name                               = "${var.project}-${var.environment}-meta"
  cluster                            = var.ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.meta.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.supabase_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.meta.arn
  }

  tags = {
    Name = "${var.project}-${var.environment}-meta"
  }
}

resource "aws_ecs_service" "studio" {
  name                               = "${var.project}-${var.environment}-studio"
  cluster                            = var.ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.studio.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.supabase_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.studio.arn
    container_name   = "studio"
    container_port   = local.supabase_studio_port
  }

  tags = {
    Name = "${var.project}-${var.environment}-studio"
  }
}
