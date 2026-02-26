environment = "production"
aws_region  = "us-east-1"

vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

web_task_cpu      = 1024
web_task_memory   = 2048
api_task_cpu      = 1024
api_task_memory   = 2048
web_desired_count = 3
api_desired_count = 3
min_capacity      = 2
max_capacity      = 20

db_instance_class    = "db.r6g.large"
db_allocated_storage = 100
db_name              = "pgmonitor"
