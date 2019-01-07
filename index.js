'use strict';
require('dotenv').config();

// モジュールの読み込み
const Discord = require('discord.js');
const RichEmbed = Discord.RichEmbed;

// インスタンスを作成
const Client = new Discord.Client();

// 準備完了時の処理
Client.on('ready', ()=>{
  console.log(`ログイン ${Client.user.tag}`);
});

// エラー処理
Client.on('error', console.error);

// ログイン処理
const token = process.env.DISCORD_BOT_TOKEN;
Client.login(token)
  .catch(console.error);

// TODO 通信が安定しない｡bufferutilとか入れる｡

const queue = new Map();

// メッセージ受信時の処理
Client.on('message', m=>{
  // サーバー以外の発言･bot自身の発言･指定プレフィックスから始まらない発言を無視
  if(!m.guild || m.author.bot || !m.content.startsWith(process.env.PREFIX)) return;

  const args = m.content.split(' ');
  const command = args.slice(1, 2).join().toLowerCase();
  const guildId = m.guild.id;

  // joinコマンド
  if(command === 'join'){
    const channelId = args[2] ? args[2].replace(/(.*)/g, '$1') : null;
    const channel = (m.guild.channels.get(channelId) || m.member.voiceChannel);
    if(channel && channel.type === 'voice'){
      channel.join().then(connection=>{
        if(!queue.get(guildId)){
          const voiceChannel = channel;
          const textChannel = m.channel;
          queue.set(guildId, {connection, voiceChannel, textChannel, controller: null, status: {audio: [], playing: false, volume: 0.5}});
        }
        m.channel.send('接続しました');
        controller(guildId);
      });
    }else{
      m.channel.send('ボイスチャンネルを指定してください');
    }
  }

  // leaveコマンド
  else if(command === 'leave'){
    if(queue.get(guildId)){
      controller(guildId, true);
      queue.get(guildId).voiceChannel.leave();
      m.channel.send('切断しました');
    }else{
      m.channel.send('ボイスチャンネルに接続されていません');
    }
  }
});

// コントローラー
function controller(guildId, leave = false){
  if(!leave){
    const embed = new RichEmbed()
    .setTitle('コントローラー(現在一部機能使用不可)')
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
      queue.get(guildId).textChannel.send(embed)
      .then(message=>{
        queue.get(guildId).controller = message;
        reactionManager(message)
          .then(()=>{
            Client.on('messageReactionAdd', (messageReaction, user)=>{
              statusManager(messageReaction, user);
            });
            Client.on('messageReactionRemove', (messageReaction, user)=>{
              statusManager(messageReaction, user);
            });
          })
      })
      .catch(console.error);
    }else{
    queue.get(guildId).controller.delete()
      .then(()=>{
        queue.delete(guildId);
      })
      .catch(console.error);
  }
}

// ステータスを制御する関数
function statusManager(messageReaction, user){
  if(messageReaction.me && user.username !== 'U20 Radio Bot' && queue.get(messageReaction.message.channel.guild.id).controller.id === messageReaction._emoji.reaction.message.id){
    const guildId = messageReaction.message.channel.guild.id;
    const reaction = messageReaction._emoji.name;
    switch(reaction){
      case '⏯':
        console.log('再生/一時停止');
        break;
      case '⏹':
        console.log('停止');
        break;
      case '⏺':
        console.log('録音');
        break;
      case '⏮':
        console.log('前のトラック');
        break;
      case '⏭':
        console.log('次のトラック');
        break;
      case '🔈':
        console.log('音量ダウン');
        break;
      case '🔊':
        console.log('音量アップ');
        break;
      case '🔇':
        console.log('ミュート');
        break;
      default:
        console.log('未対応の操作');
        break;
    }
  }
}

// リアクションをつける関数
function reactionManager(m){
  return new Promise((resolve, reject)=>{
    m.react('⏯')
      .then(()=>{
        m.react('⏹')
          .then(()=>{
            m.react('⏺')
              .then(()=>{
                m.react('⏮')
                  .then(()=>{
                    m.react('⏭')
                      .then(()=>{
                        m.react('🔈')
                          .then(()=>{
                            m.react('🔊')
                              .then(()=>{
                                m.react('🔇')
                                  .then(resolve);
                              });
                          });
                      });
                  });
              });
          });
      });
  });
}
