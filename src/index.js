import { config } from "dotenv";
import {
  ButtonStyle,
  Client,
  ComponentType,
  EmbedBuilder,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import { ChzzkApi } from "./api/chzzk.js";
import { LiveDetail } from "./api/LiveStatus.js";

config(); // env 초기화

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// BOT_TOKEN을 env로 받아옴 (github같은 public에 공개하면 봇 털림)
const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// 아직 파악중
const rest = new REST({ version: 10 }).setToken(BOT_TOKEN);

// Bot이 시작 되었을 때 실행 될 이벤트
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

/**
 * 메세지가 올라오면 실행 할 이벤트
 * https://discord.com/developers/docs/topics/rpc#messagecreatemessageupdatemessagedelete
 */
client.on("messageCreate", (message) => {
  console.log(message.content);
});

/**
 * Guild User가 application command 를 보낼 때 발생하는 이벤트
 * https://discord.com/developers/docs/topics/gateway-events#interaction-create
 */
const commands = [
  {
    name: "ping",
    description: "will say pong",
  },
  {
    name: "get_channel_info",
    description: "스트리머의 채널",
    options: [
      {
        name: "channel_id",
        description: "채널 정보",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "get_live_info",
    description: "스트리머 라이브 정보",
    options: [
      {
        name: "channel_id",
        description: "채널 아이디",
        type: 3,
        required: true,
      },
    ],
  },
];

const commandsList = {
  ping: "pong",
  channelInfo: "1234",
};

// 2. sent Application Command 를 감지 후 이벤트 발생
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  let channelID = null;
  let result = null;

  switch (interaction.commandName) {
    case "get_channel_info":
      channelID = interaction.options.get("channel_id").value;

      if (channelID.length !== 32) {
        interaction.reply("채널 아이디 길이가 다릅니다.");

        return;
      }

      const channelRow = new ChzzkApi(channelID);

      result = await channelRow.getAxiosChannelInfo();

      console.log(channelRow);

      // 성공적
      if (result.status) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: channelRow.channelName,
            iconURL: channelRow.channelImageUrl,
            url: `https://chzzk.naver.com/${channelRow.channelID}`,
          })
          .setColor("Yellow")
          .addFields(
            {
              name: "팔로우",
              value: channelRow.followerCount.toLocaleString(),
              inline: true,
            },
            {
              name: "채널 설명",
              value: channelRow.channelDescription
                ? channelRow.channelDescription
                : "Empty",
              inline: true,
            },
            {
              name: "라이브 상태",
              value: channelRow.openLive ? "ON" : "OFF",
            }
          );

        // { name: "\u200B", value: "\u200B" },
        interaction.reply({ embeds: [embed] });
      } else {
        interaction.reply(`에러가 발생 했습니다. ${result}`);
        console.log(result);
      }

      break;

    case "get_live_info":
      channelID = interaction.options.get("channel_id").value;

      if (channelID.length !== 32) {
        interaction.reply("채널 아이디 길이가 다릅니다.");

        return;
      }

      const channelLiveDetail = new LiveDetail(channelID);

      result = await channelLiveDetail.getLiveDetail();

      // Success
      if (result.status) {
        // { name: "\u200B", value: "\u200B" },
        interaction.reply({
          embeds: [
            {
              author: {
                name: `${channelLiveDetail.channelName} 님이 방송중 입니다!`,
                iconURL: channelLiveDetail.channelImageUrl,
                url: `https://chzzk.naver.com/${channelLiveDetail.channelID}`,
              },
              title: channelLiveDetail.liveTitle,
              fields: [
                {
                  name: "Game",
                  value: channelLiveDetail.liveCategory,
                  inline: true,
                },
                {
                  name: "시청자 수",
                  value: channelLiveDetail.concurrentUserCount.toString(),
                  inline: true,
                },
              ],
              image: { url: channelLiveDetail.liveImageUrl },
              timestamp: channelLiveDetail.openDate,
            },
          ],
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  label: "방송가기",
                  style: ButtonStyle.Link,
                  url: `https://chzzk.naver.com/live/${channelLiveDetail.channelID}`,
                },
              ],
            },
          ],
        });

        console.log(`${interaction.user.globalName}님이 라이브 여부를 확인`);
      } else {
        interaction.reply(`ERROR: ${result.error}`);
      }

      break;
  }

  // if 또는 switch로 도배하기에는 너무 코드가 더러워질것 같아서 객체로 따로 빼내주어 관리
  if (commandsList.hasOwnProperty(interaction.commandName)) {
    await interaction.reply(commandsList[interaction.commandName]);
  }
});

async function main() {
  try {
    console.log("Started refreshing application (/) commands.");

    // 1. Application Guild Commands Setting
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    client.login(BOT_TOKEN);
  } catch (error) {
    console.log(error);
  }
}

main();
