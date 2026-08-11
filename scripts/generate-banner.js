const fs = require("fs");

const username = process.env.GITHUB_USERNAME;
const token = process.env.GITHUB_TOKEN;

if (!username || !token) {
  throw new Error("Missing GitHub username or token");
}

const query = `
query($login: String!) {
  user(login: $login) {

    name
    login

    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }

      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      restrictedContributionsCount
    }

    repositories(
      first: 100
      ownerAffiliations: OWNER
      privacy: PUBLIC
    ) {
      totalCount
    }
  }
}
`;

async function getGitHubData() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Ketan2035-GitHub-Banner"
    },

    body: JSON.stringify({
      query,
      variables: {
        login: username
      }
    })
  });

  const json = await response.json();

  if (json.errors) {
    console.error(json.errors);
    throw new Error("GitHub GraphQL request failed");
  }

  return json.data.user;
}

function calculateStreak(days) {
  const sorted = [...days].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].contributionCount > 0) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  let index = sorted.length - 1;

  while (index >= 0) {
    const day = new Date(sorted[index].date);
    day.setHours(0, 0, 0, 0);

    if (sorted[index].contributionCount > 0) {
      currentStreak++;
      index--;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createBanner(stats) {

  const width = 1200;
  const height = 420;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
>

  <defs>

    <linearGradient
      id="background"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="100%"
    >
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#581c87"/>
    </linearGradient>

    <linearGradient
      id="accent"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="0%"
    >
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>

    <filter id="shadow">
      <feDropShadow
        dx="0"
        dy="8"
        stdDeviation="12"
        flood-opacity="0.35"
      />
    </filter>

  </defs>

  <!-- Background -->

  <rect
    width="1200"
    height="420"
    rx="28"
    fill="url(#background)"
  />

  <!-- Decorative glow -->

  <circle
    cx="1080"
    cy="50"
    r="180"
    fill="#a855f7"
    opacity="0.08"
  />

  <circle
    cx="80"
    cy="380"
    r="180"
    fill="#22d3ee"
    opacity="0.07"
  />

  <!-- Header -->

  <text
    x="600"
    y="70"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial, Helvetica, sans-serif"
    font-size="42"
    font-weight="700"
  >
    Ketan Kumar
  </text>

  <text
    x="600"
    y="105"
    text-anchor="middle"
    fill="#cbd5e1"
    font-family="Arial, Helvetica, sans-serif"
    font-size="17"
  >
    Full Stack Developer • MERN • AI Products
  </text>

  <!-- Accent -->

  <rect
    x="440"
    y="125"
    width="320"
    height="3"
    rx="2"
    fill="url(#accent)"
  />

  <!-- Row 1 -->

  <g filter="url(#shadow)">

    <rect
      x="60"
      y="155"
      width="330"
      height="95"
      rx="18"
      fill="#ffffff"
      fill-opacity="0.08"
      stroke="#ffffff"
      stroke-opacity="0.12"
    />

    <rect
      x="435"
      y="155"
      width="330"
      height="95"
      rx="18"
      fill="#ffffff"
      fill-opacity="0.08"
      stroke="#ffffff"
      stroke-opacity="0.12"
    />

    <rect
      x="810"
      y="155"
      width="330"
      height="95"
      rx="18"
      fill="#ffffff"
      fill-opacity="0.08"
      stroke="#ffffff"
      stroke-opacity="0.12"
    />

  </g>

  <!-- Row 1 Labels -->

  <text
    x="225"
    y="190"
    text-anchor="middle"
    fill="#cbd5e1"
    font-family="Arial"
    font-size="15"
  >
    🔥 CURRENT STREAK
  </text>

  <text
    x="225"
    y="228"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial"
    font-size="30"
    font-weight="700"
  >
    ${stats.currentStreak} days
  </text>


  <text
    x="600"
    y="190"
    text-anchor="middle"
    fill="#cbd5e1"
    font-family="Arial"
    font-size="15"
  >
    🏆 LONGEST STREAK
  </text>

  <text
    x="600"
    y="228"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial"
    font-size="30"
    font-weight="700"
  >
    ${stats.longestStreak} days
  </text>


  <text
    x="975"
    y="190"
    text-anchor="middle"
    fill="#cbd5e1"
    font-family="Arial"
    font-size="15"
  >
    📊 CONTRIBUTIONS
  </text>

  <text
    x="975"
    y="228"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial"
    font-size="30"
    font-weight="700"
  >
    ${stats.contributions}
  </text>


  <!-- Row 2 -->

  <g>

    <rect
      x="60"
      y="275"
      width="250"
      height="90"
      rx="18"
      fill="#ffffff"
      fill-opacity="0.07"
    />

    <rect
      x="330"
      y="275"
      width="250"
      height="90"
      rx="18"
      fill="#ffffff"
      fill-opacity="0.07"
    />

    <rect
      x="600"
      y="275"
      width="250"
      height="90"
      rx="18"
      fill="#ffffff"
      fill-opacity="0.07"
    />

    <rect
      x="870"
      y="275"
      width="270"
      height="90"
      rx="18"
      fill="#ffffff"
      fill-opacity="0.07"
    />

  </g>


  <text
    x="185"
    y="310"
    text-anchor="middle"
    fill="#cbd5e1"
    font-family="Arial"
    font-size="14"
  >
    📅 ACTIVE DAYS
  </text>

  <text
    x="185"
    y="345"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial"
    font-size="26"
    font-weight="700"
  >
    ${stats.activeDays}
  </text>


  <text
    x="455"
    y="310"
    text-anchor="middle"
    fill="#cbd5e1"
    font-family="Arial"
    font-size="14"
  >
    🔀 PULL REQUESTS
  </text>

  <text
    x="455"
    y="345"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial"
    font-size="26"
    font-weight="700"
  >
    ${stats.prs}
  </text>


  <text
    x="725"
    y="310"
    text-anchor="middle"
    fill="#cbd5e1"
    font-family="Arial"
    font-size="14"
  >
    💻 COMMITS
  </text>

  <text
    x="725"
    y="345"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial"
    font-size="26"
    font-weight="700"
  >
    ${stats.commits}
  </text>


  <text
    x="1005"
    y="310"
    text-anchor="middle"
    fill="#cbd5e1"
    font-family="Arial"
    font-size="14"
  >
    🐛 ISSUES
  </text>

  <text
    x="1005"
    y="345"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial"
    font-size="26"
    font-weight="700"
  >
    ${stats.issues}
  </text>


  <!-- Footer -->

  <text
    x="600"
    y="395"
    text-anchor="middle"
    fill="#94a3b8"
    font-family="Arial"
    font-size="12"
  >
    github.com/Ketan2035 • Automatically updated
  </text>

</svg>
`;
}

async function main() {

  const user = await getGitHubData();

  const calendar =
    user.contributionsCollection.contributionCalendar;

  const days = calendar.weeks.flatMap(
    week => week.contributionDays
  );

  const streak = calculateStreak(days);

  const activeDays = days.filter(
    day => day.contributionCount > 0
  ).length;

  const stats = {
    contributions: calendar.totalContributions,

    activeDays,

    currentStreak: streak.currentStreak,

    longestStreak: streak.longestStreak,

    commits:
      user.contributionsCollection
        .totalCommitContributions,

    prs:
      user.contributionsCollection
        .totalPullRequestContributions,

    issues:
      user.contributionsCollection
        .totalIssueContributions
  };

  fs.mkdirSync("assets", {
    recursive: true
  });

  fs.writeFileSync(
    "assets/github-banner.svg",
    createBanner(stats)
  );

  console.log("GitHub banner generated:");
  console.log(stats);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
