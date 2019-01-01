'use strict';
require('dotenv').config();

// モジュールの読み込み
const Discord = require('discord.js');

// インスタンスを作成
const client = new Discord.Client();

// 準備完了時の処理
client.on('ready', ()=>{
  console.log(`Logged in ${client.user.tag}`);
});

// ログイン処理
const token = process.env.DISCORD_BOT_TOKEN;
client.login(token);
