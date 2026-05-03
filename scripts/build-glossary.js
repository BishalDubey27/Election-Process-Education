const fs = require('fs');

const glossary = [
  {
    term: "Electoral College",
    simple: "A group of representatives who cast the official votes for president in the USA.",
    full: "A body of 538 electors established by the US Constitution, which forms every four years for the sole purpose of electing the president and vice president. Each state gets electors equal to its total congressional representation.",
    related: ["swing state", "popular vote"],
    countries: ["USA"]
  },
  {
    term: "FPTP",
    simple: "First Past The Post — the candidate with the most votes wins, even without a majority.",
    full: "An electoral system in which voters cast a single vote for one candidate. The candidate with the most votes wins the seat, regardless of whether they have an absolute majority. Used in the UK, India, and USA.",
    related: ["plurality", "constituency", "majority"],
    countries: ["UK", "India", "USA"]
  },
  {
    term: "Proportional Representation",
    simple: "Seats in parliament are distributed based on each party's share of the total vote.",
    full: "An electoral system where the percentage of seats a party wins in parliament closely matches the percentage of votes it received. Germany uses a mixed-member proportional system combining direct seats with party list seats.",
    related: ["party list", "Zweitstimme", "coalition"],
    countries: ["Germany"]
  },
  {
    term: "Preferential Voting",
    simple: "Voters rank candidates in order of preference instead of picking just one.",
    full: "Also called instant-runoff voting. Voters number candidates 1, 2, 3, etc. If no candidate wins a majority of first-preference votes, the candidate with the fewest votes is eliminated and their votes redistributed. Used in Australia.",
    related: ["informal vote", "how-to-vote card", "majority"],
    countries: ["Australia"]
  },
  {
    term: "Primary Election",
    simple: "A vote within a political party to choose who will represent it in the main election.",
    full: "A preliminary election in which voters select a political party's candidate for a subsequent general election. In the US, primaries can be open (any voter) or closed (only registered party members). Some states use caucuses instead.",
    related: ["caucus", "nominee", "general election"],
    countries: ["USA"]
  },
  {
    term: "Caucus",
    simple: "A local meeting where party members publicly choose their preferred candidate.",
    full: "A local gathering of registered party members who vote for their preferred presidential candidate through discussion and public declaration, rather than a secret ballot. Iowa holds the first presidential caucus in the US election cycle.",
    related: ["primary election", "delegate", "nominee"],
    countries: ["USA"]
  },
  {
    term: "Swing State",
    simple: "A US state where either major party could win, making it crucial in presidential elections.",
    full: "Also called a battleground state. A US state where the two major political parties have similar levels of support, making the outcome uncertain. Candidates focus significant campaign resources on swing states because they can tip the Electoral College result.",
    related: ["Electoral College", "popular vote"],
    countries: ["USA"]
  },
  {
    term: "Model Code of Conduct",
    simple: "Rules that Indian political parties and candidates must follow during election campaigns.",
    full: "A set of guidelines issued by the Election Commission of India that comes into effect immediately upon announcement of the election schedule. It restricts the ruling party from using government resources for campaigning and ensures a level playing field for all parties.",
    related: ["Election Commission of India", "campaign"],
    countries: ["India"]
  },
  {
    term: "EVM",
    simple: "Electronic Voting Machine — the device used to cast votes in Indian elections.",
    full: "A standalone electronic device used in Indian elections to record votes. EVMs are tamper-resistant, battery-operated, and paired with a VVPAT printer. They replaced paper ballots in Indian elections starting in the 1990s.",
    related: ["VVPAT", "indelible ink"],
    countries: ["India"]
  },
  {
    term: "VVPAT",
    simple: "A paper slip printed by the EVM that lets voters verify their vote was recorded correctly.",
    full: "Voter Verifiable Paper Audit Trail. A device attached to the EVM that prints a paper slip showing the candidate and party symbol voted for. The slip is visible to the voter for 7 seconds before dropping into a sealed box, providing a physical audit trail.",
    related: ["EVM", "audit"],
    countries: ["India"]
  },
  {
    term: "Returning Officer",
    simple: "The official responsible for running an election in a specific constituency.",
    full: "An official appointed to oversee the conduct of an election in a particular constituency. Responsibilities include accepting nominations, overseeing polling, counting votes, and declaring the result.",
    related: ["constituency", "nomination"],
    countries: ["India", "UK", "Australia"]
  },
  {
    term: "Constituency",
    simple: "A geographic area whose voters elect one representative to parliament.",
    full: "A defined geographic area whose registered voters elect a representative to a legislative body. In the UK there are 650 constituencies. In India, Lok Sabha constituencies each elect one member. Boundaries are periodically reviewed by independent commissions.",
    related: ["FPTP", "Returning Officer"],
    countries: ["UK", "India", "USA", "Australia"]
  },
  {
    term: "Erststimme",
    simple: "The first vote in German elections — used to directly elect a local candidate.",
    full: "German for 'first vote.' In German federal elections, each voter casts two ballots. The Erststimme is used to directly elect a candidate to represent the local constituency in the Bundestag. The candidate with the most votes wins the seat outright.",
    related: ["Zweitstimme", "Bundestag"],
    countries: ["Germany"]
  },
  {
    term: "Zweitstimme",
    simple: "The second vote in German elections — determines how many seats each party gets overall.",
    full: "German for 'second vote.' The more important of the two votes in German federal elections. The Zweitstimme is cast for a party list rather than an individual candidate. It determines the proportional share of Bundestag seats each party receives, subject to the 5% threshold.",
    related: ["Erststimme", "5% Threshold"],
    countries: ["Germany"]
  },
  {
    term: "5% Threshold",
    simple: "German parties must win at least 5% of the national vote to enter the Bundestag.",
    full: "A legal requirement in German electoral law designed to prevent extreme parliamentary fragmentation. A party must receive at least 5% of the national Zweitstimme vote, or win at least 3 direct constituency seats, to be allocated seats in the Bundestag proportionally.",
    related: ["Zweitstimme", "Bundestag", "coalition"],
    countries: ["Germany"]
  },
  {
    term: "Coalition Government",
    simple: "A government formed by two or more parties because no single party won a majority.",
    full: "When no single party wins enough seats for a parliamentary majority, parties negotiate to form a coalition. They agree on a joint policy programme and share cabinet positions. Coalition governments are common in Germany and India. The process can take weeks or months.",
    related: ["majority", "5% Threshold"],
    countries: ["Germany", "India"]
  },
  {
    term: "Compulsory Voting",
    simple: "All eligible citizens are legally required to vote or face a fine.",
    full: "A system in which voting is a legal obligation for all enrolled citizens. Australia has had compulsory voting since 1924. Failure to vote without a valid reason results in a fine. Proponents argue it increases democratic legitimacy; critics argue it infringes on freedom of choice.",
    related: ["informal vote", "enrolment"],
    countries: ["Australia"]
  },
  {
    term: "Writ of Election",
    simple: "The official document that formally starts an election in the UK or Australia.",
    full: "A formal legal document issued by the Crown (UK) or Governor-General (Australia) to the Returning Officer of each constituency, directing them to conduct an election. The issue of writs formally begins the election process and sets the timetable for nominations and polling.",
    related: ["dissolution", "Returning Officer", "nomination"],
    countries: ["UK", "Australia"]
  },
  {
    term: "Absentee Ballot",
    simple: "A ballot cast by a voter who cannot attend their polling station in person.",
    full: "A ballot submitted by a voter who is unable to vote in person at their designated polling station on election day. In the US, absentee ballots are typically submitted by mail. Eligibility requirements vary by state. Also called a postal vote or mail-in ballot.",
    related: ["early voting", "provisional ballot"],
    countries: ["USA"]
  },
  {
    term: "Provisional Ballot",
    simple: "A ballot given when a voter's eligibility cannot be immediately confirmed at the polling station.",
    full: "A failsafe ballot used in US elections when there is a question about a voter's eligibility. The ballot is set aside and only counted after election officials verify the voter's eligibility, typically after election day.",
    related: ["absentee ballot", "voter registration", "canvass"],
    countries: ["USA"]
  },
  {
    term: "Canvass",
    simple: "The official process of reviewing and verifying all ballots to produce the final vote count.",
    full: "The official post-election process in which election authorities review, tabulate, and verify all ballots cast — including mail-in, absentee, and provisional ballots — to produce the certified vote count. The canvass is distinct from the initial election night count.",
    related: ["certification", "provisional ballot", "recount"],
    countries: ["USA"]
  },
  {
    term: "Recount",
    simple: "A re-tallying of votes, usually triggered when the margin of victory is very small.",
    full: "A repeat tabulation of all votes cast in an election. Recounts are typically triggered automatically when the margin of victory falls below a certain threshold, or can be requested by a candidate. Recounts can be manual or machine-assisted.",
    related: ["canvass", "certification"],
    countries: ["USA", "UK", "Australia"]
  },
  {
    term: "Inauguration",
    simple: "The formal ceremony in which the newly elected president is sworn into office.",
    full: "The formal ceremony marking the beginning of a new presidential term. In the US, the presidential inauguration takes place on January 20th following the election. The President-elect takes the oath of office administered by the Chief Justice of the Supreme Court.",
    related: ["certification", "transfer of power"],
    countries: ["USA"]
  },
  {
    term: "Indelible Ink",
    simple: "Ink applied to a voter's finger in India to prevent them from voting more than once.",
    full: "A special ink applied to the left index finger of voters in Indian elections after they cast their ballot. The ink is designed to be difficult to remove and remains visible for several days, preventing double voting. It has been used in Indian elections since 1962.",
    related: ["EVM", "polling day"],
    countries: ["India"]
  },
  {
    term: "Bundestag",
    simple: "The German federal parliament, equivalent to the House of Commons or Congress.",
    full: "The lower house of the German federal parliament. Members are elected through a mixed-member proportional system combining direct constituency seats (Erststimme) and party list seats (Zweitstimme). The Bundestag elects the Federal Chancellor and passes federal legislation.",
    related: ["Erststimme", "Zweitstimme", "coalition"],
    countries: ["Germany"]
  }
];

fs.writeFileSync('src/data/glossary.json', JSON.stringify(glossary, null, 2));
console.log('Written', glossary.length, 'glossary terms');
