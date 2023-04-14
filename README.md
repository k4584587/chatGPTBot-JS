<!-- PROJECT LOGO -->
<br />
<div align="center">

  <h2 align="center">ChatGPT Discord Bot</h3>

</div>
<br>

### 설치

1. 오픈 AI 사이트에서 api 키를 가져옵니다.  [https://openai.com/blog/openai-api](https://openai.com/blog/openai-api)
2. Discord 봇 API 키를 가져옵니다.  [https://discord.com/developers](https://discord.com/developers)
3. 프로젝트를 클론합니다.
   ```sh
   git clone https://github.com/k4584587/chatGPTBot-JS.git
   ```
4. Install docker-compose
   ```yml
    version: "3.2"
    
    services:
    
      bot:
        build: .
        container_name: chatGPT-Bot
        restart: always
        environment:
          - "DISCORD_BOT_TOKEN="
          - "OPENAI_API_KEY="
          - "DB_HOST="
          - "DB_USER="
          - "DB_PASSWORD="
          - "DB_DATABASE="
   ```
5. docker-compose 에 환경변수를 수정해줍니다. `environment`
   ```
    DISCORD_BOT_TOKEN=
    OPENAI_API_KEY=
    DB_HOST=
    DB_USER=
    DB_PASSWORD=
    DB_DATABASE=
   ```
6. 그리고 mysql 서버에 ddl 쿼리를 import 해줍니다.  
7. 마지막으로 docker-compose up --build 로 빌드합니다.

<!-- USAGE EXAMPLES -->
## 사용방법
  ```
  !msg 내용
  !delete (명령으로 세션을 초기화 할수있습니다.)
  ```

<!-- ROADMAP -->
## 로드맵
- [x] 대화 이어하기 안되는 버그 수정
- [x] 사용 안할때 자동으로 세션 삭제하는 기능 추가하기 (스켸줄 기능)

아직 미완성 봇이라 불안정할수 있습니다.


<!-- 사용된 라이브러리 -->
## 사용된 라이브러리

* [chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)
* [Discord.js](https://github.com/discordjs/discord.js)

