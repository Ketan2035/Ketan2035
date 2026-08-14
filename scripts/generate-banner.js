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

  if (!json.data || !json.data.user) {
    throw new Error("GitHub user not found");
  }

  return json.data.user;
}


/* =========================================================
   STREAK CALCULATION
========================================================= */

function calculateStreak(days) {
  const sorted = [...days].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let longestStreak = 0;
  let runningStreak = 0;

  for (const day of sorted) {
    if (day.contributionCount > 0) {
      runningStreak++;
      longestStreak = Math.max(
        longestStreak,
        runningStreak
      );
    } else {
      runningStreak = 0;
    }
  }

  let currentStreak = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].contributionCount > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak
  };
}


/* =========================================================
   ESCAPE XML
========================================================= */

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


/* =========================================================
   CREATE BANNER
========================================================= */

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

    <!-- GitHub Dark Background -->

    <linearGradient
      id="background"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="100%"
    >
      <stop
        offset="0%"
        stop-color="#0d1117"
      />

      <stop
        offset="55%"
        stop-color="#0d1117"
      />

      <stop
        offset="100%"
        stop-color="#161b22"
      />
    </linearGradient>


    <!-- GitHub Blue → Green Accent -->

    <linearGradient
      id="accent"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="0%"
    >
      <stop
        offset="0%"
        stop-color="#58a6ff"
      />

      <stop
        offset="50%"
        stop-color="#26a641"
      />

      <stop
        offset="100%"
        stop-color="#39d353"
      />
    </linearGradient>


    <!-- GitHub Contribution Green -->

    <linearGradient
      id="githubGreen"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="0%"
    >
      <stop
        offset="0%"
        stop-color="#0e4429"
      />

      <stop
        offset="50%"
        stop-color="#26a641"
      />

      <stop
        offset="100%"
        stop-color="#39d353"
      />
    </linearGradient>


    <!-- Subtle Shadow -->

    <filter id="shadow">

      <feDropShadow
        dx="0"
        dy="6"
        stdDeviation="10"
        flood-color="#000000"
        flood-opacity="0.45"
      />

    </filter>


    <!-- Blue Glow -->

    <filter id="blueGlow">

      <feGaussianBlur
        stdDeviation="5"
        result="blur"
      />

      <feMerge>

        <feMergeNode in="blur"/>

        <feMergeNode in="SourceGraphic"/>

      </feMerge>

    </filter>


    <!-- Green Glow -->

    <filter id="greenGlow">

      <feGaussianBlur
        stdDeviation="4"
        result="blur"
      />

      <feMerge>

        <feMergeNode in="blur"/>

        <feMergeNode in="SourceGraphic"/>

      </feMerge>

    </filter>

  </defs>


  <!-- =====================================================
       BACKGROUND
  ====================================================== -->

  <rect
    width="1200"
    height="420"
    rx="28"
    fill="url(#background)"
  />


  <!-- Subtle GitHub blue glow -->

  <circle
    cx="1080"
    cy="50"
    r="180"
    fill="#58a6ff"
    opacity="0.035"
  />


  <!-- Subtle GitHub green glow -->

  <circle
    cx="80"
    cy="380"
    r="180"
    fill="#39d353"
    opacity="0.035"
  />


  <!-- =====================================================
       HEADER
  ====================================================== -->

  <text
    x="600"
    y="70"
    text-anchor="middle"
    fill="#f0f6fc"
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
    fill="#8b949e"
    font-family="Arial, Helvetica, sans-serif"
    font-size="17"
  >
    Full Stack Developer • MERN • AI Products
  </text>


  <!-- GitHub Accent -->

  <rect
    x="440"
    y="125"
    width="320"
    height="3"
    rx="2"
    fill="url(#accent)"
    filter="url(#blueGlow)"
  />


  <!-- =====================================================
       TOP STAT CARDS
  ====================================================== -->

  <g filter="url(#shadow)">


    <!-- Current Streak -->

    <rect
      x="60"
      y="155"
      width="330"
      height="95"
      rx="18"
      fill="#161b22"
      stroke="#30363d"
      stroke-width="1"
    />


    <!-- Longest Streak -->

    <rect
      x="435"
      y="155"
      width="330"
      height="95"
      rx="18"
      fill="#161b22"
      stroke="#30363d"
      stroke-width="1"
    />


    <!-- Contributions -->

    <rect
      x="810"
      y="155"
      width="330"
      height="95"
      rx="18"
      fill="#161b22"
      stroke="#30363d"
      stroke-width="1"
    />

  </g>


  <!-- =====================================================
       CURRENT STREAK
  ====================================================== -->

  <text
    x="225"
    y="190"
    text-anchor="middle"
    fill="#8b949e"
    font-family="Arial"
    font-size="15"
    font-weight="600"
  >
     CURRENT STREAK
  </text>


  <text
    x="225"
    y="228"
    text-anchor="middle"
    fill="#39d353"
    font-family="Arial"
    font-size="30"
    font-weight="700"
    filter="url(#greenGlow)"
  >
    ${escapeXml(stats.currentStreak)} days
  </text>


  <!-- =====================================================
       LONGEST STREAK
  ====================================================== -->

  <text
    x="600"
    y="190"
    text-anchor="middle"
    fill="#8b949e"
    font-family="Arial"
    font-size="15"
    font-weight="600"
  >
     LONGEST STREAK
  </text>


  <text
    x="600"
    y="228"
    text-anchor="middle"
    fill="#58a6ff"
    font-family="Arial"
    font-size="30"
    font-weight="700"
    filter="url(#blueGlow)"
  >
    ${escapeXml(stats.longestStreak)} days
  </text>


  <!-- =====================================================
       CONTRIBUTIONS
  ====================================================== -->

  <text
    x="975"
    y="190"
    text-anchor="middle"
    fill="#8b949e"
    font-family="Arial"
    font-size="15"
    font-weight="600"
  >
     CONTRIBUTIONS
  </text>


  <text
    x="975"
    y="228"
    text-anchor="middle"
    fill="#39d353"
    font-family="Arial"
    font-size="30"
    font-weight="700"
    filter="url(#greenGlow)"
  >
    ${escapeXml(stats.contributions)}
  </text>


  <!-- =====================================================
       SECOND ROW
  ====================================================== -->

  <g>


    <!-- Active Days -->

    <rect
      x="60"
      y="275"
      width="250"
      height="90"
      rx="18"
      fill="#161b22"
      stroke="#30363d"
      stroke-width="1"
    />


    <!-- Pull Requests -->

    <rect
      x="330"
      y="275"
      width="250"
      height="90"
      rx="18"
      fill="#161b22"
      stroke="#30363d"
      stroke-width="1"
    />


    <!-- Commits -->

    <rect
      x="600"
      y="275"
      width="250"
      height="90"
      rx="18"
      fill="#161b22"
      stroke="#30363d"
      stroke-width="1"
    />


    <!-- Issues -->

    <rect
      x="870"
      y="275"
      width="270"
      height="90"
      rx="18"
      fill="#161b22"
      stroke="#30363d"
      stroke-width="1"
    />

  </g>


  <!-- =====================================================
       ACTIVE DAYS
  ====================================================== -->

  <text
    x="185"
    y="310"
    text-anchor="middle"
    fill="#8b949e"
    font-family="Arial"
    font-size="14"
    font-weight="600"
  >
     ACTIVE DAYS
  </text>


  <text
    x="185"
    y="345"
    text-anchor="middle"
    fill="#39d353"
    font-family="Arial"
    font-size="26"
    font-weight="700"
  >
    ${escapeXml(stats.activeDays)}
  </text>


  <!-- =====================================================
       PULL REQUESTS
  ====================================================== -->

  <text
    x="455"
    y="310"
    text-anchor="middle"
    fill="#8b949e"
    font-family="Arial"
    font-size="14"
    font-weight="600"
  >
     PULL REQUESTS
  </text>


  <text
    x="455"
    y="345"
    text-anchor="middle"
    fill="#58a6ff"
    font-family="Arial"
    font-size="26"
    font-weight="700"
  >
    ${escapeXml(stats.prs)}
  </text>


  <!-- =====================================================
       COMMITS
  ====================================================== -->

  <text
    x="725"
    y="310"
    text-anchor="middle"
    fill="#8b949e"
    font-family="Arial"
    font-size="14"
    font-weight="600"
  >
     COMMITS
  </text>


  <text
    x="725"
    y="345"
    text-anchor="middle"
    fill="#39d353"
    font-family="Arial"
    font-size="26"
    font-weight="700"
  >
    ${escapeXml(stats.commits)}
  </text>


  <!-- =====================================================
       ISSUES
  ====================================================== -->

  <text
    x="1005"
    y="310"
    text-anchor="middle"
    fill="#8b949e"
    font-family="Arial"
    font-size="14"
    font-weight="600"
  >
     ISSUES
  </text>


  <text
    x="1005"
    y="345"
    text-anchor="middle"
    fill="#58a6ff"
    font-family="Arial"
    font-size="26"
    font-weight="700"
  >
    ${escapeXml(stats.issues)}
  </text>


  <!-- =====================================================
       FOOTER
  ====================================================== -->

  <text
    x="600"
    y="395"
    text-anchor="middle"
    fill="#6e7681"
    font-family="Arial"
    font-size="12"
  >
   • github.com/Ketan2035 • 
  </text>


</svg>
`;
}


/* =========================================================
   MAIN
========================================================= */

async function main() {

  const user = await getGitHubData();

  const calendar =
    user.contributionsCollection.contributionCalendar;

  const days =
    calendar.weeks.flatMap(
      week => week.contributionDays
    );


  const streak =
    calculateStreak(days);


  const activeDays =
    days.filter(
      day => day.contributionCount > 0
    ).length;


  const stats = {

    contributions:
      calendar.totalContributions,

    activeDays,

    currentStreak:
      streak.currentStreak,

    longestStreak:
      streak.longestStreak,

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


  fs.mkdirSync(
    "assets",
    {
      recursive: true
    }
  );


  fs.writeFileSync(
    "assets/github-banner.svg",
    createBanner(stats)
  );


  console.log(
    "GitHub banner generated:"
  );

  console.log(stats);

}


main().catch(error => {

  console.error(error);

  process.exit(1);

});
