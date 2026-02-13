# Oracle Cloud에 배포하기

이 문서는 Latin in Seoul 앱을 **Oracle Cloud Infrastructure (OCI)** 에 배포하는 방법을 안내합니다.

---

## 1. Oracle Cloud 준비

### 1.1 VM 인스턴스 생성 (Always Free 가능) — 단계별

[Oracle Cloud 콘솔](https://cloud.oracle.com) 로그인 후 **Compute** → **Instances** → **Create instance** 로 들어가면 아래 순서대로 화면이 나옵니다.

---

#### 1단계: Name and placement (이름·리전)

- **Name:** 예) `latin-in-seoul`
- **Placement:** 기본값(현재 리전) 사용

---

#### 2단계: Image and shape (이미지·스펙)

- **Image:** **Ubuntu 22.04** 선택 (또는 24.04)
- **Shape:** **VM.Standard.E2.1.Micro** (Always Free, 1 OCPU, 1GB RAM)

---

#### 3단계: Networking (네트워크)

- **VNIC이란?**  
  Virtual Network Interface Card의 줄임말로, VM에 붙는 **가상 랜카드(네트워크 인터페이스)** 입니다.  
  이걸 통해 VM이 VCN(가상 네트워크)에 연결되고, 인터넷(공인 IP)으로 접속할 수 있습니다.

- **VNIC name (VNIC 이름):**  
  이 네트워크 인터페이스를 구분하기 위한 **이름(라벨)** 입니다.  
  - 그냥 **비워 두거나**  
  - 예: `primary-vnic`, `latin-vnic` 처럼 아무 이름이나 넣어도 됩니다.  
  - 콘솔에서 나중에 "어떤 VM의 어떤 NIC인지" 구분할 때만 쓰이므로, 기본값이 있으면 그대로 두고 진행해도 됩니다.

- **Primary VNIC:** 기본값 사용
- **Private IPv4 address assignment:**  
  VM에 붙는 **사설(Private) IP**를 어떻게 줄지 정하는 항목입니다.  
  - **기본값(예: "Auto-assign" / "Subnet default")** 그대로 두면 됩니다.  
  - Oracle이 선택한 서브넷 안에서 자동으로 사설 IP를 하나 할당합니다.  
  - 수동으로 지정할 필요 없음.
- **Subnet:** **Public subnet** 이 있으면 선택. 없으면 **"Create new public subnet"** 선택 시 아래 폼이 뜹니다.
  - **New subnet name:** 아무 이름이나 가능. 예: `latin-public-subnet` 또는 기본값 `subnet-20260213-1213` 그대로 둬도 됨.
  - **Create in compartment:** 그대로 **whitesunny65 (root)** 사용.
  - **CIDR block:** **10.0.0.0/24** 그대로 두면 됨 (VM 한두 대 쓰기에 충분한 범위).
- **Public IPv4 address:** **Assign a public IPv4 address** 선택 (인터넷에서 접속할 **공인 IP** 부여)

---

#### 4단계: Add SSH keys (SSH 키)

- **Generate a key pair for me** 선택 → **Save Private Key** / **Save Public Key** 둘 다 다운로드 후 **Private Key** 안전하게 보관 (한 번만 받을 수 있음)
- 또는 이미 가지고 있는 공개키가 있으면 **Upload public key files** 로 올리기

---

#### 5단계: Boot volume (부팅 디스크)

- **Use in-transit encryption:** 켜도 되고 끄도 됨 (성능·보안 선택)
- 나머지는 기본값으로 두고 **다음** → 필요하면 용량만 50GB 등으로 조정

---

#### 6단계: Security (보안) — Shielded instance

- **Shielded instance:** **꺼도 됨 (비활성화 권장)**  
  - Shielded instance는 보안 강화 옵션이지만, Always Free Shape 중 일부와는 호환이 안 되거나 제한이 있을 수 있음.  
  - 일반 웹 서버용이면 **비활성화** 해 두는 편이 안전하고, 문제 없이 생성 가능.
- 나머지 옵션(Encryption in transit 등)은 기본값으로 두고 진행해도 됨.

---

#### 7단계: 마지막 확인

- 요약 화면에서 **Create** 클릭
- 생성이 끝나면 인스턴스 상세에서 **Public IP address** 확인 (SSH 접속·웹 접속에 사용)

---

### 1.2 방화벽(보안 목록) 열기

- **Networking** → **Virtual Cloud Networks** → 해당 VCN → **Security Lists**
- Ingress 규칙 추가:
  - **Source:** 0.0.0.0/0
  - **Destination port:** 22 (SSH), 80 (HTTP), 443 (HTTPS)
- 또는 인스턴스에 **Network Security Group** 사용 시 80, 443 허용

**SSH 연결 타임아웃일 때 추가 확인:**

1. **올바른 Security List 수정 여부**  
   인스턴스 상세 → **Networking** 탭 → **Subnet** 이름 클릭 → 그 서브넷에 연결된 **Security List**를 열어서 22번 포트 Ingress가 있는지 확인. (다른 VCN의 리스트를 수정했을 수 있음.)

2. **Egress(나가는 트래픽) 규칙**  
   같은 Security List에서 **Egress Rules**에 **대상 0.0.0.0/0, All protocols** 또는 TCP 허용이 있어야 인스턴스가 SSH 응답을 보낼 수 있음. 없으면 추가.

3. **Oracle Cloud Shell에서 SSH 시도**  
   OCI 콘솔 우측 상단 **>_** (Cloud Shell) 열고, 같은 키/공인 IP로 `ssh -i 키파일 ubuntu@공인IP` 실행.  
   - Cloud Shell에서는 되고 PC에서는 안 되면 → PC 방화벽/백신 또는 회사·집 공유기에서 22번 차단 가능성.  
   - Cloud Shell에서도 타임아웃이면 → 인스턴스 쪽(보안 목록·서브넷·라우트) 재확인.

4. **Serial Console**  
   인스턴스 **Resources** 왼쪽 메뉴에서 **Serial Console** 사용. 네트워크 없이 콘솔 접속 가능. 접속 후 `sudo systemctl status ssh` 로 sshd 동작 여부 확인.

---

## 2. 서버 접속 및 Docker 설치

### 2.1 SSH 접속이란?

**SSH** = 내 PC에서 Oracle Cloud VM(서버)에 **터미널(검은 창)로 로그인**하는 방식입니다.  
접속에 필요한 것 두 가지:

1. **Private Key 파일** — VM 만들 때 "Generate a key pair for me"로 **다운로드해 둔 키 파일** (`.key` 또는 비밀키만 저장한 파일)
2. **공인 IP** — Oracle 콘솔에서 인스턴스 상세 화면에 나오는 **Public IP address**

### 2.2 접속 명령 (Windows PowerShell 또는 WSL)

```bash
# 형식: ssh -i "키파일경로" ubuntu@공인IP
# 예시 (키 파일이 C:\Users\User\Downloads\키이름.key 에 있고, 공인 IP가 123.45.67.89 일 때)
ssh -i "C:\Users\User\Downloads\키이름.key" ubuntu@123.45.67.89
```

- **`-i "..."`** : 사용할 비밀키 파일 경로 (본인 PC에서 키 저장한 위치로 바꾸기)
- **`ubuntu`** : Ubuntu 이미지라서 기본 사용자 이름이 `ubuntu`
- **`@뒤`** : VM의 **공인 IP** (콘솔에서 복사)

처음 접속 시 "Are you sure you want to continue connecting?" 나오면 **yes** 입력 후 엔터.

### 2.3 Windows에서 PuTTY 쓰는 경우

1. [PuTTY](https://www.putty.org/) 설치
2. **PuTTYgen**으로 `.key` 파일을 **.ppk** 로 변환 (Conversions → Import key → Save private key)
3. **PuTTY** 실행 → Host name에 `ubuntu@공인IP` 입력 → Connection → SSH → Auth에서 .ppk 파일 지정 → Open

### 2.4 접속 후: Docker 설치

```bash
# SSH 접속 (키 경로는 본인 환경에 맞게)
ssh -i /path/to/your-key.key ubuntu@<인스턴스_공인_IP>

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a644 /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker ubuntu
# 재접속 후 docker 명령 사용 가능
```

---

## 3. 앱 배포 (Docker)

### 3.1 코드 올리기

**방법 A: Git 사용 (권장)**

```bash
# 서버에서
cd ~
git clone https://github.com/<your-username>/latin_in_seoul.git
cd latin_in_seoul
```

**방법 B: 로컬에서 이미지 빌드 후 레지스트리/서버로 전달**

- 로컬: `docker build -t latin-in-seoul .`
- `docker save` / `docker load` 또는 OCI Container Registry 사용

### 3.2 환경 변수

```bash
# .env 파일 생성 (프로덕션용)
cat << 'EOF' > .env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="여기에-랜덤-긴-문자열-설정"
NODE_ENV=production
EOF
```

- `AUTH_SECRET`: 관리자 세션 서명용. 예: `openssl rand -base64 32` 로 생성

### 3.3 Docker 이미지 빌드 및 실행

```bash
cd ~/latin_in_seoul   # 또는 앱 디렉터리

# 이미지 빌드
docker build -t latin-in-seoul .

# 컨테이너 실행 (볼륨으로 DB·업로드 유지)
docker run -d \
  --name latin-app \
  -p 3000:3000 \
  -v $(pwd)/data/prisma:/app/prisma \
  -v $(pwd)/data/uploads:/app/public/uploads \
  --env-file .env \
  --restart unless-stopped \
  latin-in-seoul
```

- `data/prisma`: SQLite DB 파일 유지
- `data/uploads`: 업로드 이미지 유지

### 3.4 관리자 계정 생성 (최초 1회)

DB가 새로 만들어진 경우 시드로 관리자 계정을 넣어야 합니다.

```bash
docker exec -it latin-app node /app/prisma/seed.mjs
```

- 아이디: `admin` / 비밀번호: `ehdsuz12#`
- 이미 있으면 "Admin user already exists." 만 출력됩니다.

---

## 4. Nginx 리버스 프록시 (선택, 80/443 사용 시)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/latin
```

다음 내용 추가 후 저장:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 또는 인스턴스 공인 IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/latin /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

이후 브라우저에서 `http://<인스턴스_공인_IP>` 또는 `http://your-domain.com` 으로 접속합니다.

---

## 5. HTTPS (선택, Let’s Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

도메인이 Oracle Cloud 인스턴스 IP를 가리키도록 DNS A 레코드가 설정되어 있어야 합니다.

---

## 6. 요약 체크리스트

| 항목 | 확인 |
|------|------|
| OCI VM 인스턴스 생성 (Ubuntu 22.04) | |
| 보안 목록에서 80, 443 (및 22) 열기 | |
| Docker 설치 및 `docker` 그룹 추가 | |
| 앱 디렉터리에서 `docker build` | |
| `.env`에 `DATABASE_URL`, `AUTH_SECRET` 설정 | |
| `docker run` 시 `prisma`·`uploads` 볼륨 마운트 | |
| 최초 1회 관리자 시드 실행 (admin / ehdsuz12#) | |
| (선택) Nginx 리버스 프록시 | |
| (선택) 도메인 + certbot HTTPS | |

---

## 7. 유용한 명령어

```bash
# 로그 확인
docker logs -f latin-app

# 재시작
docker restart latin-app

# 이미지 업데이트 후 재배포
docker stop latin-app && docker rm latin-app
docker build -t latin-in-seoul .
docker run -d ...  # 위 3.3과 동일 옵션으로 다시 실행
```

문제가 있으면 `docker logs latin-app` 과 서버의 `.env` 설정을 먼저 확인하세요.
