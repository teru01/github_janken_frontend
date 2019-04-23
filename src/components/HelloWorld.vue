<template>
  <div class="hello">
    <h1>
      <img id="logo" src="/images/favicon.png">GitHubじゃんけん
    </h1>
    <h3 for="counters">相手のGitHub Username</h3>
    <input type="text" name="counters" class="github_id" v-model="counterpart_id">

    <h3 v-if="result" id="counter_contributions">{{ counter_contributions }}</h3>

    <h2 id="vs" v-if="!result">VS</h2>
    <p v-if="result">
      <img :src="image_path">
    </p>
    <p v-if="loading">loading...</p>
    <h4 v-if="error">{{ error }}</h4>
    <h3 v-if="result">{{ your_contributions }}</h3>

    <h3 for="yours" class="github_id">あなたのGitHub Username</h3>
    <input type="text" name="yours" v-model="your_id">
    <p id="janken_btn">
      <button class="janken" @click="janken_start">じゃんけん</button>
    </p>
    <button :disabled="!this.your_id">
      <social-sharing :url="challenge_url" title="じゃんけんしようぜ！" hashtags="GitHubじゃんけん" inline-template>
        <div>
          <network network="twitter">
              <i class="fab fa-twitter"></i> 勝負を申し込む
          </network>
        </div>
      </social-sharing>
    </button>
    <!-- <vue-goodshare-twitter page_url="https://github.com"
    title_social="Facebook"></vue-goodshare-twitter> -->
    <p v-if="message">{{ message }}</p>
    <div v-if="result && result !== 'ERROR'" class="twitter">
      <a
        href="https://twitter.com/share?ref_src=twsrc%5Etfw"
        class="twitter-share-button"
        :data-text="tweet_msg"
        data-url="https://github-janken.herokuapp.com/"
        data-show-count="false"
      >Tweet</a>
    </div>

    <p>【遊び方】</p>
    <ul>
      <li>1.相手と自分のGitHub Usernameを入力します。(己自身と闘うこともできます)</li>
      <br>
      <li>2.直近1年間のContribution数の多い方が勝ち。</li>
    </ul>
    <p>【勝負を申し込む】</p>
    <ul>
      <li>1.自分のGitHub Usernameを入力します。</li>
      <br>
      <li>2.「勝負を申し込む」でURLを相手に送りつけましょう。</li>
    </ul>
    <small>
      &copy; {{copyright_date}} Teruya Ono
      <img src="/images/sheep_icon.png">
      <a href="https://twitter.com/teru0x1">@teru0x1</a>.
    </small>
  </div>
</template>
<script>
import api from "../api/index.js";
export default {
  name: "HelloWorld",
  data() {
    return {
      counterpart_id: "",
      your_id: "",
      counter_contributions: 0,
      your_contributions: 0,
      error: "",
      result: "",
      message: "",
      loading: false
    };
  },

  methods: {
    async get_contributions(id) {
      const response = await api()
        .get(`/contributions?github_id=${id}`)
        .catch(err => err.response || err);

      if (response.status === 404) {
        this.result = "ERROR";
        throw new Error("GitHub Usernameは正しいですか？");
      } else if (response.status !== 200) {
        this.result = "ERROR";
        throw new Error(
          "予期せぬエラーです。製作者に問い合わせると修正してくれる可能性があります。"
        );
      }
      return response.data.contributions;
    },

    my_challenge(event) {
      if (!this.your_id) {
        this.result = "ERROR";
        this.error = "自分のGitHub Usernameを入力してください。";
        // e.preventDefault();
        if (event) {
          // console.log("event")
          event.stopPropagation();
        }
        return;
      }
    },

    async janken_start() {
      this.error = "";
      this.result = "";
      this.message = "";
      this.loading = true;
      this.your_contributions = 0;
      this.counter_contributions = 0;
      try {
        const regexp = /\w+/;
        if (!(regexp.test(this.counterpart_id) && regexp.test(this.your_id))) {
          this.result = "ERROR";
          throw new Error("GitHub Usernameが不正です。");
        }
        const [counters, yours] = await Promise.all([
          this.get_contributions(this.counterpart_id),
          this.get_contributions(this.your_id)
        ]);
        this.loading = false;
        this.counter_contributions = counters;

        this.your_contributions = yours;
      } catch (e) {
        this.error = e.message;
        this.loading = false;
        return;
      }

      this.make_message();

      // Twitterボタンの動的生成
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://platform.twitter.com/widgets.js";
      script.charset = "utf-8";

      const first_script = document.getElementsByTagName("script")[0];
      first_script.parentNode.insertBefore(script, first_script);
    },

    make_message() {
      if (this.counter_contributions > this.your_contributions) {
        this.result = "LOSE";
        const messages = [
          "相手の勝ち。なんで負けたか、明日まで考えといて下さい。",
          "相手の勝ち。たかがcontribution数、そう思ってないですか？",
          "相手の勝ち。ほな、（内定）いただきます。"
        ];
        this.message =
          messages[Math.floor(Math.random() * 10) % messages.length];
      } else if (this.counter_contributions < this.your_contributions) {
        const messages = [
          "あなたの勝ち。やるやん！",
          "あなたの勝ち。では、（内定）どうぞ。"
        ];
        this.message =
          messages[Math.floor(Math.random() * 10) % messages.length];
        this.result = "WIN";
      } else {
        this.message =
          "引き分け。今日1つcontributionしたら、あなたの勝ちです。";
        this.result = "DRAW";
      }
    }
  },

  mounted() {
    const params = new URLSearchParams(window.location.search);
    this.counterpart_id = params.get("opponent_id");
  },

  computed: {
    tweet_msg() {
      return this.result
        ? `${this.counterpart_id}(${this.counter_contributions}) VS ${
            this.your_id
          }(${this.your_contributions}) ${this.message} ＃GitHubじゃんけん`
        : "GitHubのContribution数で勝負しよう！ #GitHubじゃんけん";
    },

    challenge_url() {
      return `https://github-janken.herokuapp.com/?opponent_id=${this.your_id}`;
    },

    copyright_date() {
      const y = new Date().getFullYear();
      return y > 2019 ? `2019-${y}` : "2019";
    },

    image_path() {
      if (this.result === "WIN") {
        return "/images/you_win.png";
      } else if (this.result === "LOSE") {
        return "/images/you_lose.png";
      } else if (this.result === "DRAW") {
        return "/images/draw.png";
      } else if (this.result === "ERROR") {
        return "/images/error.png";
      } else {
        return "";
      }
    }
  }
};
</script>

<style scoped>
h1 {
  margin-bottom: 80px;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

#counter_contributions {
  margin-top: 40px;
  margin-bottom: 40px;
}

#janken_btn {
  margin-top: 40px;
}

#vs {
  margin-top: 30px;
  margin-bottom: 30px;
}

#logo {
  margin-right: 10px;
  margin-bottom: 8px;
}
</style>
