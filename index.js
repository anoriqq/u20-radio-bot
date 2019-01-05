'use strict';
require('dotenv').config();

// モジュールの読み込み
const Discord = require('discord.js');
const RichEmbed = Discord.RichEmbed;

// インスタンスを作成
const Client = new Discord.Client();

// 準備完了時の処理
Client.on('ready', ()=>{
  console.log(`Logged in ${Client.user.tag}`);
});

// エラー処理
Client.on('error', console.error);

// TODO 通信が安定しない｡bufferutilとか入れる｡

const queue = new Map();

// メッセージ受信時の処理
Client.on('message', m=>{
  // サーバー以外の発言･bot自身の発言･指定プレフィックスから始まらない発言を無視
  if(!m.guild || m.author.bot || !m.content.startsWith(process.env.PREFIX)) return;

  const args = m.content.split(' ');
  const command = args.slice(1, 2).join().toLowerCase();

  // joinコマンド
  if(command === 'join'){
    const channelId = args[2] ? args[2].replace(/(.*)/g, '$1') : null;
    const channel = (m.guild.channels.get(channelId) || m.member.voiceChannel);
    if(channel && channel.type === 'voice'){
      channel.join().then(connection=>{
        if(!queue.get(m.guild.id)){
          const voiceChannel = channel;
          const textChannel = m.channel;
          queue.set(m.guild.id, {connection, voiceChannel, textChannel, controller: null, audio: [], playing: false});
        }
        m.channel.send('接続しました');
        controller(m);
      });
    }else{
      m.channel.send('ボイスチャンネルを指定してください');
    }
  }

  // leaveコマンド
  else if(command === 'leave'){
    if(queue.get(m.guild.id)){
      controller(m, true);
      queue.get(m.guild.id).voiceChannel.leave();
      m.channel.send('切断しました');
    }else{
      m.channel.send('ボイスチャンネルに接続されていません');
    }
  }
});

// コントローラー
function controller(m, leave = false){
  if(!leave){
    console.log('コントローラー表示');
    const embed = new RichEmbed()
      .setTitle('コントローラー')
      .setDescription('リアクションで操作してください\n'
        + ':play_pause: 再生/一時停止\n'
        + ':stop_button: 停止\n'
        + ':record_button: 録音\n'
        + ':track_previous: 前のトラック\n'
        + ':track_next: 次のトラック\n'
        + ':speaker: 音量ダウン\n'
        + ':loud_sound: 音量アップ\n'
        + ':mute: ミュート')
      .setColor('GOLD');
    m.channel.send(embed)
      .then(message=>{
        queue.get(m.guild.id).controller = message;
        message.react('⏯').then(()=>{
          message.react('⏹').then(()=>{
            message.react('⏺').then(()=>{
              message.react('⏮').then(()=>{
                message.react('⏭').then(()=>{
                  message.react('🔈').then(()=>{
                    message.react('🔊').then(()=>{
                      message.react('🔇');
                    });
                  });
                });
              });
            });
          });
        });
      })
      .catch(console.error);
  }else{
    console.log('コントローラー削除');
    queue.get(m.guild.id).controller.delete()
      .then(()=>{
        queue.delete(m.guild.id);
      })
      .catch(console.error);
  }
}

// ログイン処理
const token = process.env.DISCORD_BOT_TOKEN;
Client.login(token)
  .catch(console.error);
