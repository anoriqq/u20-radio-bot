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

// エラー処理
client.on('error', console.error);

// TODO 通信が安定しない｡bufferutilとか入れる｡

const queue = new Map();

// メッセージ受信時の処理
client.on('message', m=>{
  // サーバー以外の発言･bot自身の発言･指定プレフィックスから始まらない発言を無視
  if(!m.guild || m.author.bot || !m.content.startsWith(process.env.PREFIX)) return;

  const args = m.content.split(' ');
  const command = args.slice(1, 2).join().toLowerCase();
  const serverQueue = queue.get(m.guild.id);

  // joinコマンド
  if(command === 'join'){
    const channelId = args[2] ? args[2].replace(/(.*)/g, '$1') : null;
    const channel = (m.guild.channels.get(channelId) || m.member.voiceChannel);
    if(channel && channel.type === 'voice'){
      channel.join().then(connection=>{
        if(!serverQueue){
          const voiceChannel = channel;
          const textChannel = m.channel;
          queue.set(m.guild.id, {connection, voiceChannel, textChannel, audio: [], playing: false});
        }
        m.channel.send('接続しました');
      });
    }else{
      m.channel.send('ボイスチャンネルを指定してください');
    }
  }

  // leaveコマンド
  else if(command === 'leave'){
    if(serverQueue){
      serverQueue.voiceChannel.leave();
      queue.delete(m.guild.id);
      m.channel.send('切断しました');
    }else{
      m.channel.send('ボイスチャンネルに接続されていません');
    }
  }
});

// ログイン処理
const token = process.env.DISCORD_BOT_TOKEN;
client.login(token);
