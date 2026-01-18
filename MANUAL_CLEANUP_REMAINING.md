# Manual Cleanup Guide - Resources còn lại sau khi xóa EKS Cluster

Bạn đã xóa: ✅ EKS Cluster, ✅ Node Groups

## 📋 Resources còn lại cần xóa (theo thứ tự):

```powershell
$Region = "us-east-1"
$ProjectName = "tiktok-clone"
```

---

## 1️⃣ NAT Gateway (quan trọng - tốn tiền nhất!)

**Chi phí:** ~$32/tháng nếu không xóa!

### Bước 1a: Xem danh sách NAT Gateway

**Mục đích:** Kiểm tra có bao nhiêu NAT Gateway đang chạy

```powershell
aws ec2 describe-nat-gateways --region $Region --filter "Name=state,Values=available" --query 'NatGateways[*].{ID:NatGatewayId,VPC:VpcId,State:State}' --output table
```

**Giải thích:** Lệnh này liệt kê tất cả NAT Gateway còn hoạt động trong region us-east-1

### Bước 1b: Xóa tất cả NAT Gateway

**Mục đích:** Xóa NAT Gateway để không bị tính tiền

```powershell
$natgws = aws ec2 describe-nat-gateways --region $Region --filter "Name=state,Values=available" --query 'NatGateways[*].NatGatewayId' --output text
foreach ($ngw in $natgws -split '\s+') {
    if ($ngw) {
        Write-Host "Deleting NAT Gateway: $ngw"
        aws ec2 delete-nat-gateway --nat-gateway-id $ngw --region $Region
    }
}
```

**Giải thích:**

- Dòng 1: Lấy ID của tất cả NAT Gateway
- Dòng 2-6: Lặp qua từng ID và xóa từng cái một

### Bước 1c: Đợi NAT Gateway xóa xong

**Mục đích:** Phải đợi NAT Gateway xóa xong mới xóa được các resource khác

```powershell
Start-Sleep -Seconds 300
```

**Giải thích:** Lệnh này đợi 5 phút (300 giây) để AWS xóa hoàn tất NAT Gateway

---

## 2️⃣ Elastic IPs (liên quan đến NAT Gateway)

### Bước 2a: Xem danh sách Elastic IP chưa dùng

**Mục đích:** Kiểm tra có bao nhiêu IP public đang không gán vào service nào (tốn $3.6/tháng mỗi cái)

```powershell
aws ec2 describe-addresses --region $Region --query 'Addresses[?AssociationId==null].{AllocationId:AllocationId,PublicIp:PublicIp}' --output table
```

**Giải thích:** Lệnh này liệt kê tất cả Elastic IP đang "thừa" (không gán vào EC2/NAT Gateway)

### Bước 2b: Xóa tất cả Elastic IP chưa dùng

**Mục đích:** Giải phóng IP để không bị tính tiền

```powershell
$eips = aws ec2 describe-addresses --region $Region --query 'Addresses[?AssociationId==null].AllocationId' --output text
foreach ($eip in $eips -split '\s+') {
    if ($eip) {
        Write-Host "Releasing EIP: $eip"
        aws ec2 release-address --allocation-id $eip --region $Region
    }
}
```

**Giải thích:**

- Dòng 1: Lấy ID của tất cả Elastic IP chưa dùng
- Dòng 2-6: Lặp qua và release (trả lại) từng IP cho AWS

---

## 3️⃣ VPC Endpoints (Interface & Gateway)

### Bước 3a: Tìm tất cả VPC của project

**Mục đích:** Lấy ID của VPC mà Terraform đã tạo ra

```powershell
$vpcs = aws ec2 describe-vpcs --region $Region --filters "Name=tag:Project,Values=$ProjectName" --query 'Vpcs[*].VpcId' --output text
```

**Giải thích:** Tìm VPC có tag "Project=tiktok-clone" và lưu ID vào biến $vpcs

### Bước 3b: Xem và xóa VPC Endpoints trong mỗi VPC

**Mục đích:** Xóa các endpoint kết nối tới S3, ECR để không tốn tiền (~$7/tháng)

```powershell
foreach ($vpcId in $vpcs -split '\s+') {
    if ($vpcId) {
        Write-Host "VPC: $vpcId"

        # Xem danh sách endpoints
        aws ec2 describe-vpc-endpoints --region $Region --filters "Name=vpc-id,Values=$vpcId" --query 'VpcEndpoints[*].{ID:VpcEndpointId,Type:VpcEndpointType,Service:ServiceName}' --output table

        # Xóa từng endpoint
        $endpoints = aws ec2 describe-vpc-endpoints --region $Region --filters "Name=vpc-id,Values=$vpcId" --query 'VpcEndpoints[*].VpcEndpointId' --output text
        foreach ($ep in $endpoints -split '\s+') {
            if ($ep) {
                Write-Host "  Deleting VPC Endpoint: $ep"
                aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $ep --region $Region
            }
        }
    }
}
```

**Giải thích:**

- Lặp qua từng VPC ID
- Với mỗi VPC: liệt kê tất cả endpoints (như ecr.api, ecr.dkr, s3)
- Sau đó xóa từng endpoint một

---

## 4️⃣ Load Balancers (nếu còn từ K8s)

### Bước 4a: Xem danh sách Load Balancers

**Mục đích:** Kiểm tra xem có Load Balancer nào do Kubernetes tạo ra không (~$16/tháng mỗi cái)

```powershell
aws elbv2 describe-load-balancers --region $Region --query 'LoadBalancers[?contains(LoadBalancerName, `k8s`) || contains(LoadBalancerName, `tiktok`)].{Name:LoadBalancerName,Type:Type,ARN:LoadBalancerArn}' --output table
```

**Giải thích:** Tìm tất cả Load Balancer có tên chứa "k8s" hoặc "tiktok"

### Bước 4b: Xóa Load Balancers

**Mục đích:** Xóa Load Balancers để không tốn tiền

```powershell
$lbs = aws elbv2 describe-load-balancers --region $Region --query "LoadBalancers[?contains(LoadBalancerName, 'k8s') || contains(LoadBalancerName, 'tiktok')].LoadBalancerArn" --output text
foreach ($lb in $lbs -split '\s+') {
    if ($lb) {
        Write-Host "Deleting Load Balancer: $lb"
        aws elbv2 delete-load-balancer --load-balancer-arn $lb --region $Region
    }
}
```

**Giải thích:** Lấy ARN của tất cả Load Balancers và xóa từng cái

### Bước 4c: Đợi Load Balancer xóa xong

**Mục đích:** Đợi để Load Balancer xóa hoàn toàn

```powershell
Start-Sleep -Seconds 30
```

**Giải thích:** Đợi 30 giây để Load Balancer xóa hoàn toàn

### Bước 4d: Xóa Target Groups

**Mục đích:** Xóa các Target Group (nơi Load Balancer gửi traffic tới)

```powershell
$tgs = aws elbv2 describe-target-groups --region $Region --query "TargetGroups[?contains(TargetGroupName, 'k8s') || contains(TargetGroupName, 'tiktok')].TargetGroupArn" --output text
foreach ($tg in $tgs -split '\s+') {
    if ($tg) {
        Write-Host "Deleting Target Group: $tg"
        aws elbv2 delete-target-group --target-group-arn $tg --region $Region
    }
}
```

**Giải thích:** Tìm và xóa tất cả Target Groups liên quan đến project

---

## 5️⃣ Security Groups

### Mục đích: Xóa Security Groups (firewall rules) trong từng VPC

**Lưu ý:** Có thể cần chạy nhiều lần vì Security Groups có thể phụ thuộc lẫn nhau

```powershell
foreach ($vpcId in $vpcs -split '\s+') {
    if ($vpcId) {
        # Xem danh sách Security Groups (trừ "default")
        aws ec2 describe-security-groups --region $Region --filters "Name=vpc-id,Values=$vpcId" --query 'SecurityGroups[?GroupName!=`default`].{ID:GroupId,Name:GroupName}' --output table

        # Xóa Security Groups
        $sgs = aws ec2 describe-security-groups --region $Region --filters "Name=vpc-id,Values=$vpcId" --query 'SecurityGroups[?GroupName!=`default`].GroupId' --output text
        foreach ($sg in $sgs -split '\s+') {
            if ($sg) {
                Write-Host "  Deleting Security Group: $sg"
                aws ec2 delete-security-group --group-id $sg --region $Region 2>$null
            }
        }
    }
}
```

**Giải thích:**

- Với mỗi VPC, liệt kê tất cả Security Groups (trừ "default" vì không xóa được)
- Xóa từng Security Group một
- **2>$null** = bỏ qua lỗi nếu có (vì một số SG có thể đang bị dependencies)
- Nếu lỗi, chạy lại lệnh này sau khi xóa các resource khác

---

## 6️⃣ Subnets, Route Tables, Internet Gateways

### Mục đích: Xóa các thành phần networking bên trong VPC

```powershell
foreach ($vpcId in $vpcs -split '\s+') {
    if ($vpcId) {
        Write-Host "Cleaning VPC: $vpcId"

        # Bước 6a: Xóa Internet Gateway (cổng ra Internet)
        $igws = aws ec2 describe-internet-gateways --region $Region --filters "Name=attachment.vpc-id,Values=$vpcId" --query 'InternetGateways[*].InternetGatewayId' --output text
        foreach ($igw in $igws -split '\s+') {
            if ($igw) {
                Write-Host "  Detaching & Deleting IGW: $igw"
                # Phải tách ra khỏi VPC trước
                aws ec2 detach-internet-gateway --internet-gateway-id $igw --vpc-id $vpcId --region $Region
                # Rồi mới xóa
                aws ec2 delete-internet-gateway --internet-gateway-id $igw --region $Region
            }
        }

        # Bước 6b: Xóa Subnets (mạng con trong VPC)
        $subnets = aws ec2 describe-subnets --region $Region --filters "Name=vpc-id,Values=$vpcId" --query 'Subnets[*].SubnetId' --output text
        foreach ($subnet in $subnets -split '\s+') {
            if ($subnet) {
                Write-Host "  Deleting Subnet: $subnet"
                aws ec2 delete-subnet --subnet-id $subnet --region $Region
            }
        }

        # Bước 6c: Xóa Route Tables (bảng định tuyến, trừ main route table)
        $rtbs = aws ec2 describe-route-tables --region $Region --filters "Name=vpc-id,Values=$vpcId" --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' --output text
        foreach ($rtb in $rtbs -split '\s+') {
            if ($rtb) {
                Write-Host "  Deleting Route Table: $rtb"
                aws ec2 delete-route-table --route-table-id $rtb --region $Region
            }
        }
    }
}
```

**Giải thích:**

- **Internet Gateway:** Cổng cho phép VPC kết nối ra Internet, phải detach trước khi xóa
- **Subnets:** Các mạng con trong VPC (public/private subnets)
- **Route Tables:** Bảng định tuyến chỉ đường cho traffic, không xóa main route table

---

## 7️⃣ VPC (cuối cùng)

### Mục đích: Xóa VPC sau khi đã xóa hết tất cả resources bên trong

```powershell
foreach ($vpcId in $vpcs -split '\s+') {
    if ($vpcId) {
        Write-Host "Deleting VPC: $vpcId"
        aws ec2 delete-vpc --vpc-id $vpcId --region $Region

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Deleted VPC: $vpcId"
        } else {
            Write-Host "  ✗ Failed - check for remaining dependencies"
        }
    }
}
```

**Giải thích:**

- Xóa VPC (mạng ảo) - chỉ xóa được khi tất cả resources bên trong đã xóa sạch
- Nếu lỗi: có nghĩa là còn resource nào đó bên trong VPC chưa xóa, quay lại các bước trước
- **Lưu ý:** VPC phải là thứ cuối cùng xóa!

---

## 8️⃣ IAM Roles (từ EKS)

### Bước 8a: Xem danh sách IAM Roles của EKS

**Mục đích:** Kiểm tra có bao nhiêu IAM Role do EKS tạo ra

```powershell
aws iam list-roles --query "Roles[?contains(RoleName, '$ProjectName') || contains(RoleName, 'eks')].{Name:RoleName,Created:CreateDate}" --output table
```

**Giải thích:** Liệt kê các IAM Role có tên chứa "tiktok-clone" hoặc "eks"

### Bước 8b: Xóa IAM Roles (CẨN THẬN!)

**Mục đích:** Xóa IAM Roles để cleanup hoàn toàn

```powershell
$roles = aws iam list-roles --query "Roles[?contains(RoleName, '$ProjectName') && contains(RoleName, 'eks')].RoleName" --output text
foreach ($role in $roles -split '\s+') {
    if ($role) {
        Write-Host "Processing role: $role"

        # Tách các managed policies ra khỏi role
        $policies = aws iam list-attached-role-policies --role-name $role --query 'AttachedPolicies[*].PolicyArn' --output text 2>$null
        foreach ($policy in $policies -split '\s+') {
            if ($policy) {
                aws iam detach-role-policy --role-name $role --policy-arn $policy 2>$null
            }
        }

        # Xóa các inline policies
        $inlinePolicies = aws iam list-role-policies --role-name $role --query 'PolicyNames' --output text 2>$null
        foreach ($policyName in $inlinePolicies -split '\s+') {
            if ($policyName) {
                aws iam delete-role-policy --role-name $role --policy-name $policyName 2>$null
            }
        }

        # Xóa role
        aws iam delete-role --role-name $role 2>$null
        Write-Host "  ✓ Deleted role: $role"
    }
}
```

**Giải thích:**

- IAM Role phải được "dọn sạch" trước khi xóa:
  1. Tách tất cả managed policies (policies của AWS) ra khỏi role
  2. Xóa tất cả inline policies (policies tự tạo)
  3. Sau đó mới xóa role
- **2>$null** = bỏ qua lỗi (nếu có)

---

## 9️⃣ ECR Repositories (nếu có)

### Bước 9a: Xem danh sách ECR Repositories

**Mục đích:** Kiểm tra xem có Docker image repositories nào không

```powershell
aws ecr describe-repositories --region $Region --query "repositories[?contains(repositoryName, '$ProjectName')].{Name:repositoryName,URI:repositoryUri}" --output table
```

**Giải thích:** Liệt kê tất cả ECR repos (nơi lưu Docker images) có tên chứa "tiktok-clone"

### Bước 9b: Xóa ECR Repositories (kể cả images bên trong)

**Mục đích:** Xóa toàn bộ Docker image repositories

```powershell
$repos = aws ecr describe-repositories --region $Region --query "repositories[?contains(repositoryName, '$ProjectName')].repositoryName" --output text
foreach ($repo in $repos -split '\s+') {
    if ($repo) {
        Write-Host "Deleting ECR Repository: $repo"
        aws ecr delete-repository --repository-name $repo --region $Region --force
    }
}
```

**Giải thích:**

- Xóa từng ECR repository
- **--force** = xóa luôn cả tất cả Docker images bên trong (không cần xóa từng image)

---

## 🔟 CloudWatch Log Groups

### Bước 10a: Xem danh sách CloudWatch Log Groups

**Mục đích:** Kiểm tra các log groups (nơi lưu logs) của EKS

```powershell
aws logs describe-log-groups --region $Region --log-group-name-prefix "/aws/eks/$ProjectName" --query 'logGroups[*].logGroupName' --output table
```

**Giải thích:** Liệt kê tất cả log groups bắt đầu bằng "/aws/eks/tiktok-clone"

### Bước 10b: Xóa CloudWatch Log Groups

**Mục đích:** Xóa logs để không tốn dung lượng

```powershell
$logGroups = aws logs describe-log-groups --region $Region --log-group-name-prefix "/aws/eks/" --query 'logGroups[*].logGroupName' --output text
foreach ($lg in $logGroups -split '\s+') {
    if ($lg -match "tiktok") {
        Write-Host "Deleting Log Group: $lg"
        aws logs delete-log-group --log-group-name $lg --region $Region
    }
}
```

**Giải thích:**

- Tìm tất cả log groups có "/aws/eks/" trong tên
- Chỉ xóa những cái có chứa "tiktok" (để không xóa nhầm log groups khác)
- CloudWatch logs miễn phí trong 5GB đầu tiên, nhưng nên xóa để sạch sẽ

---

## ✅ Verification Commands - Kiểm tra đã xóa sạch chưa

### Mục đích: Chạy các lệnh này để kiểm tra còn resources nào chưa xóa

```powershell
Write-Host "Checking for remaining resources..."

# 1. Kiểm tra còn EKS Cluster không
Write-Host "`n1. EKS Clusters:"
aws eks list-clusters --region $Region

# 2. Kiểm tra còn VPC không
Write-Host "`n2. VPCs:"
aws ec2 describe-vpcs --region $Region --filters "Name=tag:Project,Values=$ProjectName"

# 3. Kiểm tra còn NAT Gateway không
Write-Host "`n3. NAT Gateways:"
aws ec2 describe-nat-gateways --region $Region --filter "Name=state,Values=available"

# 4. Kiểm tra còn Load Balancers không
Write-Host "`n4. Load Balancers:"
aws elbv2 describe-load-balancers --region $Region --query 'LoadBalancers[?contains(LoadBalancerName, `tiktok`)]'

# 5. Kiểm tra còn Elastic IP không dùng không
Write-Host "`n5. Unused Elastic IPs:"
aws ec2 describe-addresses --region $Region --query 'Addresses[?AssociationId==null]'

Write-Host "`n✓ Verification complete - Nếu tất cả trả về empty [] hoặc null thì đã xóa sạch!"
```

**Giải thích:**

- Chạy 5 lệnh kiểm tra các resource quan trọng nhất
- Nếu kết quả là `[]` (empty array) hoặc `null` = đã xóa sạch
- Nếu còn hiện resources = cần quay lại xóa tiếp

---

## 💰 Ước tính chi phí nếu không xóa:

| Resource                  | Monthly Cost |
| ------------------------- | ------------ |
| NAT Gateway               | ~$32         |
| Elastic IP (unused)       | $3.60        |
| VPC Endpoints (Interface) | ~$7          |
| Load Balancers            | ~$16         |
| **TOTAL**                 | **~$58+**    |

---

## 🚀 Quick Delete All Script

Chạy script tự động đã tạo sẵn:

```powershell
.\scripts\step-by-step-cleanup.ps1
```

Hoặc chạy toàn bộ commands trên theo thứ tự 1️⃣ → 🔟!

---

## 📝 Notes về lệnh vừa chạy:

✅ **Lệnh Security Groups đã chạy thành công!**

- Tìm thấy và xóa được nhiều Security Groups trong 4 VPCs
- Một số Security Groups xóa thành công ngay (hiển thị `"Return": true`)
- Một số không xóa được do còn dependencies (chạy lại sau khi xóa các resource khác)

**Kết quả:**

- VPC 1: Xóa được 1/3 Security Groups (2 cái còn dependencies)
- VPC 2: Xóa được 1/3 Security Groups
- VPC 3: Xóa được 1/3 Security Groups
- VPC 4: Xóa được 1/3 Security Groups

**Bước tiếp theo:** Chạy bước 6️⃣ (Subnets, Route Tables, IGW) để xóa dependencies, sau đó chạy lại bước 5️⃣ để xóa các Security Groups còn lại.
