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
- **PostgreSQL 원격 접속용 (DBeaver 등):** 5432 포트를 열고 싶다면 같은 방식으로 5432 추가. 보안을 위해 **특정 IP만** 허용하거나, 5432는 열지 않고 **SSH 터널**로만 접속하는 것을 권장 (8장 참고).
- 또는 인스턴스에 **Network Security Group** 사용 시 80, 443 (및 필요 시 5432) 허용

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
sudo chmod 644 /etc/apt/keyrings/docker.asc
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
# .env 파일 생성 (프로덕션용) — PostgreSQL 사용
# 비밀번호는 반드시 본인이 정한 강한 비밀번호로 변경
cat << 'EOF' > .env
DATABASE_URL="postgresql://postgres:여기에Postgres비밀번호@latin-postgres:5432/latin_in_seoul"
AUTH_SECRET="여기에-랜덤-긴-문자열-설정"
NODE_ENV=production
EOF
```

- `DATABASE_URL`: Postgres 컨테이너 이름이 `latin-postgres`이고, 같은 Docker 네트워크에서 접속하므로 호스트는 `latin-postgres`, DB 이름은 `latin_in_seoul`. 비밀번호만 위에서 설정한 값과 맞추면 됩니다.
- `AUTH_SECRET`: 관리자 세션 서명용. 예: `openssl rand -base64 32` 로 생성

### 3.3 PostgreSQL + 앱 실행 (Docker)

**PostgreSQL**을 포트 5432로 띄우고, 앱은 이 DB에 연결합니다. DBeaver 등으로 **서버:5432**에 접속해 DB를 관리할 수 있습니다.

```bash
cd ~/latin_in_seoul

# 0) Docker 네트워크 생성 (최초 1회)
docker network create latin-net 2>/dev/null || true

# 1) PostgreSQL 컨테이너 실행 (최초 1회 또는 재시작 시)
docker run -d \
  --name latin-postgres \
  --network latin-net \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=여기에Postgres비밀번호 \
  -e POSTGRES_DB=latin_in_seoul \
  -v latin_postgres_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:16-alpine

# 2) 앱 이미지 빌드
docker build -t latin-in-seoul .

# 3) 앱 컨테이너 실행 (같은 네트워크에서 latin-postgres:5432 로 접속)
docker run -d \
  --name latin-app \
  --network latin-net \
  -p 3000:3000 \
  -v $(pwd)/data/uploads:/app/public/uploads \
  --env-file .env \
  --restart unless-stopped \
  latin-in-seoul
```

- `latin_postgres_data`: PostgreSQL 데이터 볼륨 (컨테이너 삭제해도 유지)
- `data/uploads`: 업로드 이미지 유지

**마이그레이션 적용 (최초 1회 또는 스키마 변경 후):**

```bash
docker exec -it latin-app npx prisma migrate deploy
```

### 3.4 관리자 계정 생성 (최초 1회)

DB가 새로 만들어진 경우 시드로 관리자 계정을 넣어야 합니다.

```bash
docker exec -it latin-app node /app/prisma/seed.mjs
```

- 아이디: `admin` / 비밀번호: `ehdsuz12#`
- 이미 있으면 "Admin user already exists." 만 출력됩니다.

**기존 SQLite에서 전환한 경우:** PostgreSQL은 새 DB이므로 기존 게시글·이미지·관리자 계정은 자동으로 옮겨지지 않습니다. 아래 3.5.1 이관 스크립트를 사용하면 됩니다. 새로 시작하는 경우 위 시드만 실행하면 됩니다.

#### 3.4.1 기존 SQLite 데이터를 PostgreSQL로 이관하기 (운영 서버 기준)

**상황:** 예전에는 SQLite로 운영했고, 지금은 같은 서버에서 PostgreSQL로 바꿨다. 예전 게시글·이미지·관리자 계정을 **운영 DB(PostgreSQL)에 다시 넣고 싶다.**

**전제:** 예전 SQLite DB 파일이 **서버 어딘가에 남아 있어야** 한다.  
예전에 `-v data/prisma:/app/prisma` 로 실행했다면 `~/latin-in-seoul/data/prisma/dev.db` 에 있을 수 있다.

---

**1단계: SQLite 파일 있는지 확인**

서버에 SSH 접속한 뒤:

```bash
cd ~/latin-in-seoul
ls -la data/prisma/
```

`dev.db` (또는 비슷한 이름의 `.db` 파일)가 있으면 그 경로를 쓰면 된다.  
없으면 예전 백업/다른 경로에서 복구한 뒤 아래를 진행한다.

---

**2단계: 이관 스크립트 실행 (서버에서, Docker로 한 번만 실행)**

**필수:** 서버에 `prisma/migrate-sqlite-to-pg.mjs` 파일이 있어야 합니다. 없으면 `Cannot find module '/app/prisma/migrate-sqlite-to-pg.mjs'` 오류가 납니다.  
로컬에서 해당 파일을 커밋·푸시한 뒤, 서버에서 `cd ~/latin-in-seoul && git pull origin main` 으로 받은 다음 아래 명령을 실행하세요.  
확인: `ls ~/latin-in-seoul/prisma/migrate-sqlite-to-pg.mjs`

**참고:** 볼륨에 프로젝트 루트 **절대 경로**를 쓰므로, `data/prisma` 안에서 실행해도 동작합니다. (다른 OS 사용자면 `/home/ubuntu/` 부분을 본인 홈 경로로 바꾸세요.)

서버에는 보통 호스트에 Node가 없으므로, **프로젝트 전체를 마운트한 컨테이너**에서 스크립트를 실행한다.  
아래에서 `admin` 과 `latin-postgres` 는 본인이 쓰는 Postgres 비밀번호·컨테이너 이름에 맞게 바꾼다.

```bash
# 프로젝트 루트를 절대 경로로 마운트 → 어느 디렉터리에서 실행해도 동작 (ubuntu 사용자 기준)
# -v /app/node_modules: 컨테이너 전용 node_modules 사용 → 호스트와 충돌(ETXTBSY) 방지
sudo docker run --rm -it \
  --network latin-net \
  -v /home/ubuntu/latin-in-seoul:/app \
  -v /app/node_modules \
  -w /app \
  -e DATABASE_URL="postgresql://postgres:admin@latin-postgres:5432/latin_in_seoul" \
  node:20-alpine \
  sh -c "npm ci && npx prisma generate && node prisma/migrate-sqlite-to-pg.mjs ./data/prisma/prisma/dev.db"
```

- `--network latin-net`: 같은 네트워크에서 `latin-postgres` 에 접속하기 위함.
- `-v /home/ubuntu/latin-in-seoul:/app`: 프로젝트 루트 **절대 경로** → 현재 디렉터리와 관계없이 항상 전체 프로젝트가 컨테이너에 마운트됨.
- `-v /app/node_modules`: **익명 볼륨** → 컨테이너만의 `node_modules` 사용. 호스트의 `node_modules`와 겹치지 않아 `npm ci` 시 ETXTBSY 오류를 막음.
- `DATABASE_URL`: **운영**에서 쓰는 PostgreSQL 주소(비밀번호 포함). `.env` 에 있는 값과 동일하게.
- 마지막 인자: **1단계에서 확인한 SQLite 파일 경로** (예: `./data/prisma/dev.db` 또는 `./data/prisma/prisma/dev.db`).

실행이 끝나면 터미널에 `Users copied.`, `Posts copied.`, `Post_images copied.`, `Done.` 같은 로그가 나온다.

---

**3단계: 결과 확인**

- 브라우저에서 **운영 사이트** 접속 → 예전에 쓰던 게시글·이미지가 보이는지 확인.
- 관리자 로그인도 예전 계정으로 되는지 확인.
- **이미지**는 DB에 경로만 들어가고, 실제 파일은 `data/uploads` 에 있어야 한다. 예전에 쓰던 `data/uploads` 를 그대로 두었다면 이관 후에도 이미지가 보인다.

---

**정리 (운영 기준으로 예전 데이터 다시 불러오기)**

1. 서버에서 예전 SQLite 파일 위치 확인 (`data/prisma/dev.db` 등).
2. 위 **2단계** 명령 한 번 실행 (DATABASE_URL·비밀번호·SQLite 경로만 본인 환경에 맞게 수정).
3. 운영 사이트에서 게시글·이미지·로그인 확인.

로컬이 아니라 **운영 DB(PostgreSQL)** 에 넣는 것이므로, 반드시 **운영 서버에서** 위 명령을 실행하고, `DATABASE_URL` 은 **운영용 PostgreSQL** 주소로 두면 된다.

### 3.5 지금 배포하기 (VM 서버에서 빌드)

로컬에서 Docker 이미지를 빌드하지 않고, **서버(VM) 안에서만** 빌드·실행하는 순서입니다.

**1) 로컬에서 코드 푸시**

```bash
git add .
git commit -m "배포: PostgreSQL 전환 등"
git push origin main
```

**2) 서버 SSH 접속 후 배포**

```bash
# 접속
ssh -i "키경로" ubuntu@서버공인IP

cd ~/latin_in_seoul
git pull origin main

# 기존 앱 컨테이너만 재배포할 때 (Postgres는 이미 떠 있음)
docker stop latin-app 2>/dev/null; docker rm latin-app 2>/dev/null
# 빌드 시 .env 의 DATABASE_URL 을 넘겨야 앱이 DB에 연결함 (Next.js 빌드 시 사용)
docker build --build-arg DATABASE_URL="$(grep DATABASE_URL .env | cut -d= -f2- | tr -d '\"')" -t latin-in-seoul .
docker run -d --name latin-app --network latin-net -p 3000:3000 \
  -v $(pwd)/data/uploads:/app/public/uploads --env-file .env --restart unless-stopped latin-in-seoul
docker exec -it latin-app npx prisma migrate deploy
```

**3) 최초 배포(Postgres·앱 둘 다 처음)일 때**

```bash
cd ~/latin_in_seoul
git pull origin main

# .env 없으면 생성 (비밀번호·AUTH_SECRET 본인 값으로 변경)
# cat << 'EOF' > .env
# DATABASE_URL="postgresql://postgres:비밀번호@latin-postgres:5432/latin_in_seoul"
# AUTH_SECRET="랜덤문자열"
# NODE_ENV=production
# EOF

docker network create latin-net 2>/dev/null || true
docker run -d --name latin-postgres --network latin-net -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=비밀번호 -e POSTGRES_DB=latin_in_seoul \
  -v latin_postgres_data:/var/lib/postgresql/data --restart unless-stopped postgres:16-alpine
docker build --build-arg DATABASE_URL="$(grep DATABASE_URL .env | cut -d= -f2- | tr -d '\"')" -t latin-in-seoul .
docker run -d --name latin-app --network latin-net -p 3000:3000 \
  -v $(pwd)/data/uploads:/app/public/uploads --env-file .env --restart unless-stopped latin-in-seoul
docker exec -it latin-app npx prisma migrate deploy
docker exec -it latin-app node /app/prisma/seed.mjs
```

**4) 기존에 SQLite로 돌리던 서버를 Postgres로 바꾸는 경우**

```bash
cd ~/latin_in_seoul
git pull origin main

# 기존 앱 중지·삭제 (DB 파일은 data/prisma 에 남음)
docker stop latin-app 2>/dev/null; docker rm latin-app 2>/dev/null

# .env 를 Postgres용으로 수정 후, 위 3)의 네트워크·postgres·앱 실행·migrate·seed 순서 실행
```

정리: **항상 서버에서 `git pull` → (필요 시 Postgres 실행) → `docker build --build-arg DATABASE_URL=...` → 앱 컨테이너 실행 → `prisma migrate deploy`** 하면 됩니다. 빌드 시 반드시 `.env`의 `DATABASE_URL`을 `--build-arg`로 넘기세요.

### 3.6 종료된 수업 자동 삭제 스케줄러 (매일 00:00)

**동작:** 종료일(`endDate`)이 **오늘 00:00 KST** 이전인 수업 게시글을 매일 자동 삭제합니다.

**1) 환경 변수**

서버 `.env`에 스케줄러 전용 비밀값을 추가합니다 (아무 긴 랜덤 문자열).

```bash
# .env 에 추가
CRON_SECRET="본인이_정한_긴_랜덤_문자열"
```

`.env` 수정 후 앱 컨테이너를 **삭제 후 다시 run** 해야 env가 반영됩니다.

**2) 서버에서 cron 등록**

한 번만 설정하면 됩니다.

```bash
crontab -e
```

아래 한 줄을 추가합니다. (서버가 **UTC**이면 00:00 KST = 15:00 UTC 이므로 `0 15 * * *` 사용. 서버가 **Asia/Seoul**이면 `0 0 * * *` 사용.)

```cron
# 매일 00:00 KST에 실행 (서버 타임존이 UTC인 경우)
0 15 * * * curl -s -H "Authorization: Bearer 본인CRON_SECRET값" http://localhost:3000/api/cron/cleanup-expired
```

또는 서버 타임존을 한국으로 두었다면:

```cron
TZ=Asia/Seoul
0 0 * * * curl -s -H "Authorization: Bearer 본인CRON_SECRET값" http://localhost:3000/api/cron/cleanup-expired
```

`본인CRON_SECRET값`은 `.env`에 넣은 `CRON_SECRET` 값과 동일하게 넣습니다.

**3) 동작 확인**

수동으로 한 번 호출해 보기:

```bash
curl -s -H "Authorization: Bearer 본인CRON_SECRET값" http://localhost:3000/api/cron/cleanup-expired
```

응답 예: `{"ok":true,"deleted":0,"cutoff":"2026-02-15T00:00:00.000+09:00"}` (삭제된 건수가 0이어도 정상).

---

## 4. 도메인 연결 + Nginx (80 포트, 선택)

### 4.1 도메인 준비

- **도메인 구매:** 가비아, Cloudflare, AWS Route 53, Namecheap 등에서 원하는 도메인 구매 (예: `latininseoul.com`).
- **DNS 설정:** 구매한 곳의 DNS 관리에서 **A 레코드** 추가:
  - **호스트/이름:** `@` (루트 도메인) 또는 `www` (서브도메인)
  - **값/목표:** Oracle 인스턴스 **공인 IP** (예: `134.185.116.81`)
  - **TTL:** 300~3600
- 전파까지 5분~몇 시간 걸릴 수 있음. `nslookup your-domain.com` 으로 IP 확인.

### 4.2 Nginx 설치 및 리버스 프록시 (80 포트)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/latin
```

다음 내용으로 채운 뒤 **`your-domain.com`을 본인 도메인으로 변경**하여 저장:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
sudo ln -sf /etc/nginx/sites-available/latin /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

이후 **http://your-domain.com** 으로 접속 (포트 번호 없이 80 사용).

---

## 5. HTTPS (선택, Let’s Encrypt)

도메인 DNS가 인스턴스 IP를 가리키고, Nginx로 80 포트 접속이 된 상태에서:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

발급 후 **https://your-domain.com** 으로 접속.  
HTTPS 사용 시 `.env`에 `SECURE_COOKIE=true` 추가 후 앱 컨테이너 재시작하면 관리자 세션 쿠키가 안전하게 동작합니다.

---

## 6. 요약 체크리스트

| 항목 | 확인 |
|------|------|
| OCI VM 인스턴스 생성 (Ubuntu 22.04) | |
| 보안 목록에서 80, 443 (및 22) 열기 | |
| Docker 설치 및 `docker` 그룹 추가 | |
| 앱 디렉터리에서 `docker build` | |
| `.env`에 `DATABASE_URL`(postgresql://...), `AUTH_SECRET` 설정 | |
| PostgreSQL 컨테이너 + 앱 컨테이너 실행, `uploads` 볼륨 마운트 | |
| `prisma migrate deploy` 실행 (최초/스키마 변경 후) | |
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
docker run -d ...  # 위 3.3의 3)과 동일 옵션으로 다시 실행
# Postgres는 그대로 두고 앱만 재시작하면 됨
```

문제가 있으면 `docker logs latin-app` 과 서버의 `.env` 설정을 먼저 확인하세요.

---

## 8. 운영 DB 접근 (DBeaver — 포트 5432)

운영 DB는 **PostgreSQL**이라 **포트 5432**로 접속할 수 있습니다. DBeaver에서 **서버 IP + 포트**로 연결하면 됩니다.

### 8.1 보안 목록에서 5432 열기 (선택)

- Oracle Cloud **Security List**에 **Destination port 5432** Ingress 규칙 추가 시, 인터넷에서 `서버공인IP:5432`로 접속 가능합니다.
- **보안 권장:** 5432를 전 세계(0.0.0.0/0)에 열지 말고, **본인 IP만** 허용하거나, 아래처럼 **SSH 터널**만 쓰는 편이 안전합니다.

### 8.2 DBeaver로 접속 (직접 포트 연결)

1. DBeaver 실행 → **데이터베이스** → **새 데이터베이스 연결** → **PostgreSQL** 선택
2. **호스트:** 서버 공인 IP (또는 도메인)
3. **포트:** 5432
4. **데이터베이스:** latin_in_seoul
5. **사용자명:** postgres
6. **비밀번호:** 3.3에서 Postgres 컨테이너에 설정한 `POSTGRES_PASSWORD`
7. **테스트 연결** → **완료** 후 조회·쿼리

### 8.3 SSH 터널로 접속 (5432 포트를 공인에 안 열 때)

5432를 보안 목록에 열지 않고, SSH로만 터널을 만들어 접속하는 방법입니다.

1. **내 PC에서 SSH 로컬 포워딩**
   ```bash
   ssh -i "개인키경로" -L 5432:localhost:5432 ubuntu@서버공인IP
   ```
   SSH 접속을 유지한 채로 둡니다.

2. **DBeaver에서 연결**
   - **호스트:** localhost (또는 127.0.0.1)
   - **포트:** 5432
   - **데이터베이스:** latin_in_seoul
   - **사용자명:** postgres
   - **비밀번호:** Postgres 비밀번호
   - (고급) **SSH** 탭에서 “SSH 터널 사용” 대신, 이미 터널을 켜 둔 상태이므로 위 설정만으로 접속됩니다.

이렇게 하면 **별도 포트(5432)로 붙는 방식**으로 DBeaver에서 운영 DB를 관리할 수 있습니다.
