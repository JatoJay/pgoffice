# PGMonitor AWS ECS Infrastructure

Terraform infrastructure for deploying PGMonitor to AWS ECS with self-hosted Supabase.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           AWS Cloud                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                         VPC                                │  │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐ │  │
│  │  │  Public Subnets │  │       Private Subnets           │ │  │
│  │  │                 │  │                                  │ │  │
│  │  │  ┌───────────┐  │  │  ┌─────────────────────────┐   │ │  │
│  │  │  │    ALB    │──┼──┼─▶│      ECS Cluster        │   │ │  │
│  │  │  └───────────┘  │  │  │  ┌─────┐ ┌─────┐        │   │ │  │
│  │  │                 │  │  │  │ Web │ │ API │        │   │ │  │
│  │  │  ┌───────────┐  │  │  │  └─────┘ └─────┘        │   │ │  │
│  │  │  │ Supabase  │──┼──┼─▶│                         │   │ │  │
│  │  │  │   ALB     │  │  │  │  ┌───────────────────┐  │   │ │  │
│  │  │  └───────────┘  │  │  │  │    Supabase       │  │   │ │  │
│  │  │                 │  │  │  │ Kong|Auth|Rest|..│  │   │ │  │
│  │  │  ┌───────────┐  │  │  │  └───────────────────┘  │   │ │  │
│  │  │  │    NAT    │  │  │  └─────────────────────────┘   │ │  │
│  │  │  │  Gateway  │  │  │                                  │ │  │
│  │  │  └───────────┘  │  │  ┌─────────────────────────┐   │ │  │
│  │  └─────────────────┘  │  │       RDS Postgres      │   │ │  │
│  │                       │  └─────────────────────────┘   │ │  │
│  │                       └─────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────┐  ┌────────────┐                                 │
│  │    ECR     │  │ CloudWatch │                                 │
│  │ (Web/API)  │  │   Logs     │                                 │
│  └────────────┘  └────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

| Component | Description |
|-----------|-------------|
| VPC | Isolated network with public/private subnets |
| ECS Cluster | Fargate cluster for web, API, and Supabase |
| ALB | Application Load Balancer for routing |
| RDS | PostgreSQL database for app and Supabase |
| ECR | Container registry for web and API images |
| Supabase | Self-hosted auth, realtime, storage, studio |

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.6.0
3. Docker for building images
4. ACM certificate for HTTPS (or use HTTP for dev)

## Quick Start

### 1. Create S3 bucket for state (one-time)

```bash
aws s3 mb s3://pgmonitor-terraform-state-dev --region us-east-1
aws dynamodb create-table \
  --table-name pgmonitor-terraform-locks-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 2. Generate Supabase keys

```bash
# Generate JWT secret (min 32 chars)
openssl rand -base64 32

# Generate anon and service role keys using supabase CLI or online tool
# https://supabase.com/docs/guides/self-hosting#api-keys
```

### 3. Create secrets file

```bash
cat > environments/dev/secrets.tfvars << EOF
certificate_arn             = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
db_username                 = "pgmonitor_admin"
db_password                 = "your-secure-password"
supabase_jwt_secret         = "your-jwt-secret-min-32-chars"
supabase_anon_key           = "your-anon-key"
supabase_service_role_key   = "your-service-role-key"
supabase_dashboard_password = "studio-password"
EOF
```

### 4. Initialize and deploy

```bash
# Initialize
./scripts/deploy.sh dev init

# Plan
./scripts/deploy.sh dev plan

# Apply
./scripts/deploy.sh dev apply
```

### 5. Build and push images

```bash
./scripts/build-push.sh dev latest
```

### 6. Force new deployment

```bash
aws ecs update-service --cluster pgmonitor-dev --service pgmonitor-dev-web --force-new-deployment
aws ecs update-service --cluster pgmonitor-dev --service pgmonitor-dev-api --force-new-deployment
```

## Environments

| Environment | VPC CIDR | RDS Instance | ECS Tasks |
|-------------|----------|--------------|-----------|
| dev | 10.0.0.0/16 | db.t3.micro | 1 each |
| staging | 10.1.0.0/16 | db.t3.small | 2 each |
| production | 10.2.0.0/16 | db.r6g.large | 3 each |

## Outputs

After deployment, get the outputs:

```bash
terraform output
```

Key outputs:
- `alb_dns_name` - Main application URL
- `supabase_url` - Supabase API URL
- `supabase_studio_url` - Supabase Studio dashboard

## Cost Estimation (Dev)

| Resource | Monthly Cost |
|----------|-------------|
| NAT Gateway (2) | ~$65 |
| ALB (2) | ~$32 |
| ECS Fargate | ~$20 |
| RDS t3.micro | ~$15 |
| **Total** | ~$132/mo |

## Cleanup

```bash
./scripts/deploy.sh dev destroy
```
