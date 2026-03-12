# 🌿 민주의 건강일지

류마티스 치료 중 매일 몸 상태, 기분, 루틴을 기록하는 개인 건강 일지 앱

## 기능
- 오늘 기록: 기분, 아침 강직, 통증, 루틴 체크, 수분, 메모
- 주간 분석: 기분 흐름, 평균 통계, 루틴 실천률, 인사이트
- 한달 분석: 히트맵, 주차별 흐름, 추세 기반 인사이트

## Vercel 배포 방법

### 1. GitHub에 올리기
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/[내아이디]/health-tracker.git
git push -u origin main
```

### 2. Vercel 연결
1. [vercel.com](https://vercel.com) 접속 → GitHub 로그인
2. "New Project" → 방금 만든 레포 선택
3. 설정 그대로 두고 "Deploy" 클릭
4. 배포 완료되면 URL 생성됨 (예: `https://health-tracker-xxx.vercel.app`)

### 3. 홈 화면에 추가 (iPhone)
1. Safari에서 배포된 URL 열기
2. 하단 공유 버튼 탭
3. "홈 화면에 추가" 선택
4. 이름 확인 후 "추가" → 앱 아이콘 생성!

## 로컬 실행
```bash
npm install
npm run dev
```
