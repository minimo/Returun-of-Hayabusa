/*

	hayabusa
	2011/07/22

*/
window.focus();
window.addEventListener('mousedown', () => window.focus());
enchant();

window.onload = function() {
	var game = new Game( 320, 320 );
	game.fps = 30;
	var sec = function( time ){ return game.fps * time; }

	game.preload(	'bar.png', 'map_earth.png', 'earth.png', 'space.jpg', 'warning.gif', 'complete.gif', 'reach.gif',
					'hayabusa1_kai.gif', 'itokawa.gif', 'h2a_rocket.gif', 'chara1.gif',　'effect.gif',
					'icon0.gif','map2.gif', 'effect.gif', 'font.png' );

	game.onload = function () {

		//環境変数
		/////////////////////////////////////////////////////////////////////////////
		event = false;			//イベント
		eventGS = false;		//ゲーム開始イベント
		eventGE = false;		//ゲーム終了イベント

		eventIT = false;		//イトカワ到着イベント

		eventSF = false;		//太陽フレアイベント
		frameSF = 0;			//イベント経過フレーム
		eventSFEnd = false;		
		frameSFEnd = 0;			//イベント長さ

		eventMT = false;		//隕石群イベント
		frameMT = 0;			//イベント経過フレーム
		eventMTEnd = false;		
		frameMTEnd = 0;			//イベント長さ

		eventNoDamage = false;	//イベントをノーダメージで終了
		perfect = true;			//ノーダメージクリア
		rescue = 0;				//クマ救助数
		dropItem = 0;			//

		touchdown = false;		//タッチダウンフラグ
		toItokawa = 7000000;	//イトカワまでの距離
		dispMsg = false;		//メッセージ表示

		score = 0;				//スコア
		count = 0;				//雑用
		enemyOff = false;		//敵出ないフラグ

		level = 0;				//ゲームレベル
		levelchk = 0;			//レベルチェックポイント
		damage_all = 0;			//総ダメージ

		//ステージ準備
		/////////////////////////////////////////////////////////////////////////////
        stage = new Group();
		game.rootScene.addChild( stage );
		game.rootScene.backgroundColor = "#000000";

		//バックグラウンド
		/////////////////////////////////////////////////////////////////////////////
		back = new Sprite( game.width, game.height );
		back.image = game.assets['space.jpg'];
		back.alpha = 0.2;
		back._element.style.opacity = 0.2;
		stage.addChild( back );

		//地球
		/////////////////////////////////////////////////////////////////////////////
		earth = new Sprite( game.width, game.height );
		earth.image = game.assets['earth.png'];
		stage.addChild( earth );

		//イトカワ
		/////////////////////////////////////////////////////////////////////////////
		itokawa = new Sprite( 64, 64 );
		itokawa.image = game.assets['itokawa.gif'];
		itokawa.scaleX = 2;
		itokawa.scaleY = 2;
		itokawa.x = 130;
		itokawa.y = -64;
		itokawa.visible = false;
		itokawa.rot1 = 180;
		itokawa.rot2 = 0;
		stage.addChild( itokawa );

		//距離表示
		/////////////////////////////////////////////////////////////////////////////
		var distance = toItokawa;	//目的地までの距離
		var destination = "ｲﾄｶﾜまで : ";
		var distanceLabel = new Label( destination + distance + " km" );
		distanceLabel.x = 5;
		distanceLabel.y = 5;
		distanceLabel.color = "#ffffff";
		distanceLabel.font = "bold";
		game.rootScene.addChild( distanceLabel );

		//スコア表示
		/////////////////////////////////////////////////////////////////////////////
		var scoreLabel = new Label( "SCORE : " + score );
		scoreLabel.x = 5;
		scoreLabel.y = 20;
		scoreLabel.color = "#ffffff";
		scoreLabel.font = "bold";
		game.rootScene.addChild( scoreLabel );

		//実行中イベント表示
		/////////////////////////////////////////////////////////////////////////////
		var eventLabel = new Label( "" );
		eventLabel.x = 5;
		eventLabel.y = 35;
		eventLabel.color = "#ffffff";
		eventLabel.font = "bold";
		game.rootScene.addChild( eventLabel );

		//推進剤残量低下警告
		/////////////////////////////////////////////////////////////////////////////
		var EWarning = new Label( "推進剤残量低下" );
		EWarning.x = 120;
		EWarning.y = 80;
		EWarning.color = "#000000";
		EWarning.font = "bold";
		EWarning.visivle = false;
		game.rootScene.addChild( EWarning );

		//イオンエンジン、シールド残量低下警告
		/////////////////////////////////////////////////////////////////////////////
		var SWarning = new Label( "シールド低下" );
		SWarning.x = 120;
		SWarning.y = 100;
		SWarning.color = "#000000";
		SWarning.font = "bold";
		SWarning.visivle = false;
		game.rootScene.addChild( SWarning );

		//デバッグ用テキスト
		/////////////////////////////////////////////////////////////////////////////
		var debugLabel = new Label( "" );
		debugLabel.color = "#ffffff";
		debugLabel.font = "bold";
		debugLabel.x = 120;
		debugLabel.y = 35;
		game.rootScene.addChild( debugLabel );

		//プレイヤキャラクタ
		/////////////////////////////////////////////////////////////////////////////
		var player = new Sprite( 32, 32 );
		player.image = game.assets['hayabusa1_kai.gif'];
		player.rotation = 180;
		player.speed = 3158;			//進行速度
		player.propellant = 1000;		//推進剤
		player.propellantMax = 1000;	//推進剤（最大量）
		player.shield = 1000;			//対放射線シールド
		player.shieldMax = 1000;		//対放射線シールド（最大量）
		player.x = 160;
		player.y = 160;
		player.vx = 0;		//加速度
		player.vy = 0;
		player.vol = 50;	//推力
		player.damaged = 0;
		player.visible = true;

		//ダメージ計算
		player.damage = function( val ){
			if( this.damaged > 0 )return;
			if( eventSF || eventMT )this.damaged = sec( 1.5 );
			else this.damaged = sec( 1 );
			eventNoDamage = false;
			perfect = false;
			this.shield -= val;
			damage_all += val;
			if( this.shield < 0 ){
				game.rootScene.backgroundColor = "#ff0000";
				back.visible = false;
				var bomb = new Sprite( 16, 16 );
				bomb.image = game.assets['effect.gif'];
				bomb.frame = 0;
				bomb.x = 285;
				bomb.y = 40;
				bomb.count = 0;
				if( life > 2 )bomb.y += 16;
				if( life % 2 == 0 )bomb.x += 16;
				bomb.addEventListener( 'enterframe', function (){
					this.count++;
					if( this.count % 2 == 0 )this.frame++;
					if( this.frame == 2 ){
						game.rootScene.backgroundColor = "#000000";
						back.visible = true;
					}
					if( this.frame > 4 ){
						stage.removeChild( this );
						delete this;
					}
				});
				stage.addChild( bomb );

				this.shield = 1000;
				life--;
				lifeDisp[life].frame = 19;
				if( life == 0 )this.shield = 0;
				level -= 2;
				if( level < 0 )level = 0;
			}
			Smeter.setNum( player.shield );
		}
		player.addEventListener( 'enterframe', function (){
			if( player.damaged > 0 ){
				if( game.frame % 2 == 0){
					if( this.visible )this.visible = false; else this.visible = true;
				}
				player.damaged--;
				if( player.damaged == 0 )this.visible = true;
			}
			if( player.shield < player.shieldMax )player.shield += 0.5;
			Smeter.setNum( player.shield );

			if( event )return;

			//制御
			this.x += this.vx / 100;
			this.y += this.vy / 100;
			var onkey = game.input.left || game.input.right || game.input.up || game.input.down;
			if( !eventGE && onkey ){
				//イオンエンジン噴射
				var fire = new Sprite( 16, 16 );
				fire.image = game.assets['map2.gif'];
				fire.frame = 13;
				fire.scale = 0.5;
				fire.scaleX = 0.5;
				fire.scaleY = 0.5;
				fire.x = this.x + 8;
				fire.y = this.y + 8;
				fire.opacity = 0.5;

				if( game.input.left ){
					this.vx -= this.vol;
					this.propellant -= 1;
					fire.x += 16;
				}
				if( game.input.right ){
					this.vx += this.vol;
					this.propellant -= 1;
					fire.x -= 16;
				}
				if( game.input.up ){
					this.vy -= this.vol;
					this.propellant -= 1;
					fire.y += 12;
				}
				if( game.input.down ){
					this.vy += this.vol;
					this.propellant -= 1;
					fire.y -= 12;
				}
				fire.addEventListener( 'enterframe', function (){
					this.opacity -= 0.05;
					this.scaleX -= 0.05;
					this.scaleY -= 0.05;
					if( this.opacity < 0 ){
						stage.removeChild( this );
						delete this;
					}
				});
				stage.addChild( fire );
			}
//			if( this.vx < 0 )this.vx += this.vol / 2;
//			if( this.vx > 0 )this.vx -= this.vol / 2;
//			if( this.vy < 0 )this.vy += this.vol / 2;
//			if( this.vy > 0 )this.vy -= this.vol / 2;

			//画面端チェック
			if( this.x < 0 ){
				this.x = 0;
				this.vx = 0;
			}
			var rightEnd = game.width - this.width;
			if( this.x > rightEnd ){
				this.x = rightEnd;
				this.vx = 0;
			}
			if( this.y < 20 ){
				this.y = 20;
				this.vy = 0;
			}
			var bottomEnd = game.height - this.height;
			if( this.y > bottomEnd ){
				this.y = bottomEnd;
				this.vy = 0;
			}
		});
        stage.addChild( player );

		//イオンエンジン表示
		/////////////////////////////////////////////////////////////////////////////
		var maxLife = 4;
		var life = 4;
		var lifeDisp = Array( maxLife );
		var wx = 285, wy = 40;
		for( i = 0; i < maxLife; i++ ){
			lifeDisp[i] = new Sprite( 16, 16 );
			lifeDisp[i].image = game.assets['icon0.gif'];
 			lifeDisp[i].frame = 20;
			lifeDisp[i].x = wx;
			lifeDisp[i].y = wy;
			wx += 16;
			if( i == 1 ){ wy += 16; wx = 285; }
			game.rootScene.addChild( lifeDisp[i] );
		}

		//推進剤残量表示
		/////////////////////////////////////////////////////////////////////////////
		var Emeter = new Group();
		Emeter.x = 160;
		Emeter.y = 5;
		Emeter.max = player.propellantMax;
		var EmeterLabel = new Label();
		EmeterLabel.text = 'Propellant:';
		EmeterLabel.color = 'white';
		Emeter.addChild( EmeterLabel );
		var Ebar = new Sprite( 100, 13 );
		var Erect = new Surface( 100, 13 );
		Ebar.x = 55;
		Erect.context.fillStyle = 'rgba( 0, 255, 0, 1.0 )';
		Erect.context.fillRect( 0, 0, 100, 13 );
		Ebar.image = Erect;
		Emeter.addChild( Ebar );
		Emeter.setNum = function( val ){
			var num = val / this.max * 100;
			Erect.context.fillStyle = 'rgba( 0, 255, 0, 1.0 )';
			Erect.context.fillRect( 0, 0, num, 13 );
			Erect.context.fillStyle = 'rgba( 255, 0, 0, 1.0 )';
			Erect.context.fillRect( num + 1, 0, 100 - num, 13 );
//			debugLabel.text = this.max + ":" + val + ":" + num;
		};
		game.rootScene.addChild( Emeter );

		//シールド残量表示
		/////////////////////////////////////////////////////////////////////////////
		var Smeter = new Group();
		Smeter.x = 160;
		Smeter.y = 20;
		Smeter.max = player.shieldMax;
		var SmeterLabel = new Label();
		SmeterLabel.text = 'S h i e l d:';
		SmeterLabel.color = 'white';
		Smeter.addChild( SmeterLabel );
		var Sbar = new Sprite( 100, 13 );
		var Srect = new Surface( 100, 13 );
		Sbar.x = 55;
		Srect.context.fillStyle = 'rgba( 0, 255, 0, 1.0 )';
		Srect.context.fillRect( 0, 0, 100, 13 );
		Sbar.image = Srect;
		Smeter.addChild( Sbar );
		Smeter.setNum = function( val ){
			var num = val / this.max * 100;
			Srect.context.fillStyle = 'rgba( 0, 255, 0, 1.0 )';
			Srect.context.fillRect( 0, 0, num, 13 );
			Srect.context.fillStyle = 'rgba( 255, 0, 0, 1.0 )';
			Srect.context.fillRect( num + 1, 0, 100 - num, 13 );
//			debugLabel.text = this.max + ":" + val + ":" + num;
		};
		game.rootScene.addChild( Smeter );

		//道中マップ
		/////////////////////////////////////////////////////////////////////////////
		var map_earth = new Sprite( 16, 16 );
		map_earth.image = game.assets['map_earth.png'];
		map_earth.x = 0;
		map_earth.y = 270;
		stage.addChild( map_earth );

		var map_itokawa = new Sprite( 64, 64 );
		map_itokawa.image = game.assets['itokawa.gif'];
		map_itokawa.scaleX = 0.25;
		map_itokawa.scaleY = 0.25;
		map_itokawa.x = -24;
		map_itokawa.y = 50 - 24;
		stage.addChild( map_itokawa );

		var map_hayabusa = new Sprite( 32, 32 );
		map_hayabusa.image = game.assets['hayabusa1_kai.gif'];
		map_hayabusa.rotation = 180;
		map_hayabusa.scaleX = 0.5;
		map_hayabusa.scaleY = 0.5;
		map_hayabusa.x = -8;
		map_hayabusa.y = 270 - 8;
		map_hayabusa.addEventListener( 'enterframe', function (){
			this.y = 270 - 220 * ( ( toItokawa - distance ) / toItokawa );
			this.y -= 8;
		});
		stage.addChild( map_hayabusa );

		//ステージ進行
		/////////////////////////////////////////////////////////////////////////////
		stage.addEventListener( 'enterframe', function() {

			//現在スコア表示
			scoreLabel.text = "SCORE : " + score;
//			debugLabel.text = "level : " + level;

			//推進剤現在量表示
			Emeter.setNum( player.propellant );

			//推進剤低下警告
			if( player.propellant < player.propellantMax * 0.2 && !event ){
				EWarning.color = "#FF0000";
				if( game.frame % sec( 0.5 ) == 0 ){
					if( EWarning.visible )EWarning.visible = false;
					else EWarning.visible = true;
				}
			}else{
				EWarning.visible = false;
			}

			//シールド＆エンジン停止警告
			if( life == 1 && player.shield < player.shieldMax * 0.5 && !event ){
				SWarning.color = "#FF0000";
				if( game.frame % sec( 0.5 ) == 0 ){
					if( SWarning.visible )SWarning.visible = false;
					else SWarning.visible = true;
				}
			}else{
				SWarning.visible = false;
			}

			//ゲームオーバー
			if( player.propellant < 0 && !event || life == 0 ){
				if( !eventGE ){
					eventGE = true;
					count = 0;
				}else{
					count++;
				}
				if( count > 5 ){
					var msg = "MISSION FAILED SCORE:" + score;
					game.end( score, msg );
				}
			}

			//ゲーム開始イベント
			if( eventGS ){
			}
			if( earth.y < 320 && !touchdown ){
				earth.y += 0.5;
			}else{
				if( back.alpha < 1.0 ){
					back.alpha += 0.05;
					back._element.style.opacity = back.alpha;
				}
			}
			if( !event ){
				distance -= player.speed;
				if( distance < 0 )distance = 0;
				distanceLabel.text = destination + distance + " km";
				if( game.frame % 30 == 0 ){
					score += ( 10 + level * 2 );
				}
			}

			//太陽フレア（往路）
			if( !touchdown && distance < toItokawa * 0.6 && !eventSF && !eventSFEnd ){
				eventSF = true;
				frameSF = 0;
				frameSFEnd = sec( 25 );	//イベント長さ
				eventNoDamage = true;
				dispSFWarning();
			}
			if( !touchdown && eventSF ){
				if( !dispMsg ){
					frameSF++;
				}

				if( frameSF == frameSFEnd ){
					frameSF = 0;
					eventSF = false;
					eventSFEnd = true;
					eventLabel.text = "";
					
					//イベント中ノーダメージの場合はボーナス
					if( eventNoDamage ){
						dispBonusMsg( 10000 );
						level++;
					}
				}
			}

			//太陽フレア（復路：弾幕版）
			if( touchdown && distance < toItokawa * 0.4 && !eventSF && !eventSFEnd ){
				enemyOff = true;
				eventSF = true;
				frameSF = 0;
				frameSFEnd = sec( 25 );	//イベント長さ
				eventNoDamage = true;
				dispSFWarning();
			}
			if( touchdown && eventSF ){
				if( !dispMsg ){
					frameSF++;
					barrage( frameSF );	//弾幕展開
				}

				if( frameSF == frameSFEnd ){
					enemyOff = false;
					frameSF = 0;
					eventSF = false;
					eventSFEnd = true;
					eventLabel.text = "";
					//イベント中ノーダメージの場合はボーナス
					if( eventNoDamage ){
						dispBonusMsg( 30000 );
						level += 2;
					}
				}
			}

			//隕石群通過（復路）
			if( touchdown && distance < toItokawa * 0.8 && !eventMT && !eventMTEnd ){
				eventMT = true;
				frameMT = 0;
				frameMTEnd = sec( 22 );	//イベント長さ
				eventNoDamage = true;
				dispMTWarning();
			}
			if( eventMT ){
				if( !dispMsg ){
					frameMT++;
				}

				if( frameMT == frameMTEnd ){
					frameMT = 0;
					eventMT = false;
					eventMTEnd = true;
					eventLabel.text = "";
					//イベント中ノーダメージの場合はボーナス
					if( eventNoDamage ){
						dispBonusMsg( 20000 );
						level += 2;
					}
				}
			}

			//イトカワ到達
			if( distance <= 0 && !event && !touchdown ){
				if( !event ){
					dispReachItokawa();
					if( life == 4 )level++; 
				}
				event = true;
				itokawa.visible = true;

				//到着イベント管理スレッド
				var arrival = new Group();
				arrival.rot1 = 180;
				arrival.rot2 = 0;
				arrival.count = 0;
				arrival.addEventListener( 'enterframe', function() {
					if( itokawa.y < 143 ){
						if( itokawa.y < 80 )itokawa.y += 1;
						else	itokawa.y += 0.5;
					}
					if( touchdown ){
						itokawa.y += 2;
						if( itokawa.y > game.height + 64 ){
							stage.removeChild( this );
							delete this;
							stage.removeChild( itokawa );
							delete itokawa;
						}
					}else{
						if( player.x > game.width / 2 - 16 )player.x -= 1;
						if( player.x < game.width / 2 - 16 )player.x += 1;
						if( player.y > game.height / 2 )player.y -= 1;
						if( player.y < game.height / 2 )player.y += 1;
						if( itokawa.y >= 143 ){
							player.frame = 1;
							arrival.count++;
							if( arrival.count > 90 ){
								//マップ情報更新
								map_earth.y = 50;
								map_itokawa.y = 270 - 24;
								map_hayabusa.y = 270 - 8;

								eventSFEnd = false;
								player.vx = 0;
								player.vy = 0;
								player.speed = 2128;	//進行速度を変更
								distance = toItokawa;
								map_hayabusa.rotation = 180;
								this.rot1 += 3;
								this.rot2 += 3;
								player.rotation = this.rot1;
								itokawa.rotation = this.rot2;
								if( this.rot1 >= 360 ){
									score += 10000;
									player.rotation = 0;
									player.frame = 0;
									itokawa.rotation = 180;
									event = false;
									touchdown = true;
									destination = "地球まで : ";
									eventLabel.text = "";
								}
							}
						}
					}
				});
				stage.addChild( arrival );
			}

			//地球到着
			if( distance <= 0 && !event && touchdown ){
				eventLabel.color = "#ffffff";
				eventLabel.text = "地球帰還";
				distance = 0;
				event = true;
				eventGE = true;
				earth.rotation = 180;
				earth.y = -320
				back.alpha = 1;
				back._element.style.opacity = back.alpha;
				//地球到着イベント管理スレッド
				arrival = new Group();
				arrival.scale = 1.0;
				arrival.addEventListener( 'enterframe', function() {
					if( back.alpha > 0 ){
						back.alpha -= 0.1;
						back._element.style.opacity = back.alpha;
					}
					if( earth.y < 1 ){
						earth.y++;
						if( player.x > game.width / 2  )player.x -= 1;
						if( player.x < game.width / 2  )player.x += 1;
						if( player.y > game.height / 2 - 35 )player.y -= 1;
						if( player.y < game.height / 2 - 35 )player.y += 1;
					}
					if( earth.y > -100 ){
						player.scaleX = this.scale;
						player.scaleY = this.scale;
						this.scale -= 0.01;
						if( this.scale <= 0 ){
							//リザルト
							pt1 = player.propellant * 20;// Propellant
							pt2 = Math.floor( player.shield ) * 10;// Shield
							pt3 = life * 10000;			// ION Engine
							pt4 = 30000;				// Clear

							var msg1 = new Label( "Propellant left  : " + pt1 );
							msg1.x = 80;
							msg1.y = 120;
							msg1.color = "#ffffff";
							msg1.visible = false;
							var msg2 = new Label( "Shield left      : " + pt2 );
							msg2.x = msg1.x;
							msg2.y = msg1.y + 20;
							msg2.color = "#ffffff";
							msg2.visible = false;
							var msg3 = new Label( "ION Engine Bonus : " + pt3 );
							msg3.x = msg2.x;
							msg3.y = msg2.y + 20;
							msg3.color = "#ffffff";
							msg3.visible = false;
							var msg4 = new Label( "Clear Bonus      : 30000" );
							msg4.x = msg3.x;
							msg4.y = msg3.y + 20;
							msg4.color = "#ffffff";
							msg4.visible = false;
							var comp = new Sprite( 320, 20 );
							comp.image = game.assets['complete.gif'];
							comp.x = 0;
							comp.y = 90;
							comp.count = 0;
							comp.line = 1.5;
							comp.visible = true;
							comp.addEventListener( 'enterframe', function() {
								this.count++;
								if( this.count == sec( 1.5 ) ){ msg1.visible = true; score += pt1;}
								if( this.count == sec( 3.0 ) ){ msg2.visible = true; score += pt2;}
								if( this.count == sec( 4.5 ) ){ msg3.visible = true; score += pt3;}
								if( this.count == sec( 6.0 ) ){ msg4.visible = true; score += pt4;}
								if( this.count == sec( 7.5 ) ){
									var msg = "MISSION COMPLETE!! SCORE:" + score;
									game.end( score, msg );
								}
							});
							stage.addChild( msg1 );
							stage.addChild( msg2 );
							stage.addChild( msg3 );
							stage.addChild( msg4 );
							stage.addChild( comp );
							stage.removeChild( this );
							delete this;
						}
					}
				});
				stage.addChild( arrival );
			}

			//道中障害物投入
			if( !event && !dispMsg && !enemyOff ){
				var dice = Math.floor( Math.random() * 100 );
				if( dice < 8 + level || !touchdown && eventSF && dice < 25 || eventMT && dice < 20 ){
					var kind = 0;	//敵種類
					var per = 85; 	//放射線になる確率
					if( eventSF )per = 95;
					if( eventMT )per = 10;
					var dice = Math.floor( Math.random() * 100 );
					if( dice <= per ){
						//宇宙放射線
						kind = 0;		//space radiation
					}else{
						var dice2 = Math.floor( Math.random() * 100 );
						if( dice2 <= 40 ){
							//隕石（小）
							kind = 1;	//meteorite
						} else if( dice2 <= 90 ){
							//隕石（大）
							kind = 2;	//meteorite
						}else{
							//隕石（特大）
							kind = 3;	//meteorite
						}
					}
					if( dice > 98 )kind = 4;	//クマー

					var dir = Math.floor( Math.random() * 3 );
					if( dir == 0 ){
						//左側から
						x = 0;
						y = Math.floor( Math.random() * 200 );
						vx = Math.floor( Math.random() * 4 ) + 1;
						vy = Math.floor( Math.random() * 4 );
					}else if( dir == 1 ){
						//上側から
						x = Math.floor( Math.random() * 320 );
						y = 0;
						vx = Math.floor( Math.random() * 7 ) - 3;
						vy = Math.floor( Math.random() * 4 ) + 1;
					}else{
						//右側から
						x = 320;
						y = Math.floor( Math.random() * 200 );
						vx = Math.floor( Math.random() * 4 ) + 1;
						vy = Math.floor( Math.random() * 4 );
						vx *= -1;
					}
					entryEnemy( kind, x, y, vx, vy );
				}

				//回復アイテム定期投入
				if( !touchdown && distance < toItokawa * 0.3 && dropItem == 0 ||
					!touchdown && distance < toItokawa * 0.6 && dropItem == 1 ||
					 touchdown && distance < toItokawa * 0.4 && dropItem == 2 ||
					 touchdown && distance < toItokawa * 0.6 && dropItem == 3 ||
					 touchdown && distance < toItokawa * 0.8 && dropItem == 4 ){
					var dir = Math.floor( Math.random() * 3 );
					if( dir == 0 ){
						//左側から
						x = 0;
						y = Math.floor( Math.random() * 200 );
						vx = Math.floor( Math.random() * 4 ) + 1;
						vy = Math.floor( Math.random() * 4 );
					}else if( dir == 1 ){
						//上側から
						x = Math.floor( Math.random() * 320 );
						y = 0;
						vx = Math.floor( Math.random() * 7 ) - 3;
						vy = Math.floor( Math.random() * 4 ) + 1;
					}else{
						//右側から
						x = 320;
						y = Math.floor( Math.random() * 200 );
						vx = Math.floor( Math.random() * 4 ) + 1;
						vy = Math.floor( Math.random() * 4 );
						vx *= -1;
					}
					entryEnemy( 4, x, y, vx, vy );
					dropItem++;
				}

				//レベルチェック
				if( !touchdown && distance < toItokawa * 0.8 && levelchk == 0 ||
					 touchdown && distance < toItokawa * 0.5 && levelchk == 1 ||
					 touchdown && distance < toItokawa * 0.6 && levelchk == 2 ||
					 touchdown && distance < toItokawa * 0.7 && levelchk == 3 ){

					if( levelchk == 0 && life == 4 && damage_all < 500 )level++;
					if( levelchk == 1 && life == 4 )level++;
					if( levelchk >= 2 && life >= 3 )level++;

					levelchk++;
				}
				
			}
		});

		//操作系
		/////////////////////////////////////////////////////////////////////////////
		game.rootScene.addEventListener('touchstart', function(e) {
			game.input.left = false;
			game.input.right = false;
			game.input.up = false;
			game.input.down = false;
			if( e.localX <  80 )game.input.left = true;
			if( e.localX > 240 )game.input.right = true;
			if( e.localY <  80 )game.input.up = true;
			if( e.localY > 240 )game.input.down = true;
		});
		game.rootScene.addEventListener('touchmove', function(e) {
			game.input.left = false;
			game.input.right = false;
			game.input.up = false;
			game.input.down = false;
			if( e.localX <  80 )game.input.left = true;
			if( e.localX > 240 )game.input.right = true;
			if( e.localY <  80 )game.input.up = true;
			if( e.localY > 240 )game.input.down = true;
		});
		game.rootScene.addEventListener('touchend', function(e) {
			game.input.left = false;
			game.input.right = false;
			game.input.up = false;
			game.input.down = false;
		});


		//弾幕展開
		/////////////////////////////////////////////////////////////////////////////
		var barrage = function( frame ){
			//上から位相を変えて直線展開
			if( frame == 10 || frame == 40 ){
				for( i = 0; i < game.width; i += 60 ){
					x = i; y = game.height;
					entryEnemy( 0, x   ,      0, 0,  3 );
					entryEnemy( 0, x+30,    -10, 0,  3 );
					entryEnemy( 0, x   , y     , 0, -3 );
					entryEnemy( 0, x+30, y + 10, 0, -3 );
				}
			}
			//４隅から扇状に展開
			if( frame % 80 == 0 && frame < 400 ){
				spd = 1;
				if( frame % 160 == 0 )spd = 2;
				x = 2; y = 2;
				for( i = 0; i <= 90; i += 20 ){
					rad = 3.14159 / 180 * i;
					entryEnemy( 0, x, y, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
				}
				x = game.width - 2; y = 2;
				for( i = 90; i <= 180; i += 20 ){
					rad = 3.14159 / 180 * i;
					entryEnemy( 0, x, y, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
				}
				x = game.width - 2; y = game.height - 2;
				for( i = 180; i <= 270; i += 20 ){
					rad = 3.14159 / 180 * i;
					entryEnemy( 0, x, y, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
				}
				x = 2; y = game.height - 2;
				for( i = 270; i <= 360; i += 20 ){
					rad = 3.14159 / 180 * i;
					entryEnemy( 0, x, y, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
				}
			}
			//上下左右より半円状に展開
			if( frame % 60 == 0 && frame > 400 ){
				spd = 1;
				if( frame % 240 == 0 )spd = 2;
				if( frame % 120 == 0 ){
					x = game.width / 2; y = 2;
					for( i = 0; i <= 180; i += 20 ){
						rad = 3.14159 / 180 * i;
						entryEnemy( 0, x, y, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
					}
					x = game.width / 2; y = game.height - 2;
					for( i = 180; i <= 360; i += 20 ){
						rad = 3.14159 / 180 * i;
						entryEnemy( 0, x, y, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
					}
				}else{
					x = 2; y = game.height / 2;
					for( i = -90; i <= 90; i += 20 ){
						rad = 3.14159 / 180 * i;
						entryEnemy( 0, x, y, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
					}
					x = game.width - 2; y = game.height / 2;
					for( i = 90; i <= 450; i += 20 ){
						rad = 3.14159 / 180 * i;
						entryEnemy( 0, x, y, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
					}
				}
			}

			//安全地帯潰し
			if( frame > 400 && frame % 180 == 0 ){
				entryEnemy( 0, 0, 0, 3, 3 );	//左上
				entryEnemy( 0, game.width, 0, -3, 3 );	//右上
				entryEnemy( 0, 0, game.height, 3, -3 );	//左下
				entryEnemy( 0, game.width, game.height, -3, -3 );	//右下
			}
			
			//アイテムドロップ
			var dice = Math.floor( Math.random() * 300 );
			if( dice == 200 ){
				var dir = Math.floor( Math.random() * 3 );
				if( dir == 0 ){
					//左側から
					x = 0;
					y = Math.floor( Math.random() * 200 );
					vx = Math.floor( Math.random() * 4 ) + 1;
					vy = Math.floor( Math.random() * 4 );
				}else if( dir == 1 ){
					//上側から
					x = Math.floor( Math.random() * 320 );
					y = 0;
					vx = Math.floor( Math.random() * 7 ) - 3;
					vy = Math.floor( Math.random() * 4 ) + 1;
				}else{
					//右側から
					x = 320;
					y = Math.floor( Math.random() * 200 );
					vx = Math.floor( Math.random() * 4 ) + 1;
					vy = Math.floor( Math.random() * 4 );
					vx *= -1;
				}
				entryEnemy( 4, x, y, vx, vy );
			}
		}

		//円形弾幕
		/////////////////////////////////////////////////////////////////////////////
		var barrageCircle = function( x, y, r, spd ){
			for( i = 0; i < 360; i += 20 ){
				rad = 3.14159 / 180 * i;
				tx = Math.cos( rad ) * r + x;
				ty = Math.sin( rad ) * r + y;
				entryEnemy( 0, tx, ty, Math.cos( rad ) * spd, Math.sin( rad ) * spd );
			}
		}

		//太陽フレア警告メッセージ表示
		/////////////////////////////////////////////////////////////////////////////
		var dispSFWarning = function(){
			dispMsg = true;
			startFrame = game.frame;
			//警告メッセージ表示
			var msg1 = new Label( "大規模太陽フレアが発生しました" );
			msg1.x = 80;
			msg1.y = 115;
			msg1.color = "#ff0000";
			stage.addChild( msg1 );
			var msg2 = new Label( "放射線量が一時的に増加します" );
			msg2.x = 85;
			msg2.y = 190;
			msg2.color = "#ff0000";
			stage.addChild( msg2 );
			var warning = new Sprite( 320, 50 );
			warning.image = game.assets['warning.gif'];
			warning.x = 0;
			warning.y = 135;
			warning.count = 0;
			warning.visible = true;
			warning.addEventListener( 'enterframe', function() {
				this.count++;
				if( this.count % sec( 0.5 ) == 0){
					if( this.visible )this.visible = false; else this.visible = true;
				}
				if( this.count == sec( 6 ) ){
					dispMsg = false;
					eventNoDamage = true;
					eventLabel.color = "#ff0000";
					eventLabel.text = "太陽フレア発生中";
					stage.removeChild( msg1 );
					stage.removeChild( msg2 );
					stage.removeChild( this );
					delete this;
				}
			});
			stage.addChild( warning );
		}

		//隕石群警告メッセージ表示
		/////////////////////////////////////////////////////////////////////////////
		var dispMTWarning = function(){
			dispMsg = true;
			startFrame = game.frame;
			//警告メッセージ表示
			var msg1 = new Label( "隕石が集中している領域を通過します" );
			msg1.x = 60;
			msg1.y = 115;
			msg1.color = "#ff0000";
			stage.addChild( msg1 );
			var msg2 = new Label( "隕石が一時的に増加します" );
			msg2.x = 90;
			msg2.y = 190;
			msg2.color = "#ff0000";
			stage.addChild( msg2 );
			var warning = new Sprite( 320, 50 );
			warning.image = game.assets['warning.gif'];
			warning.x = 0;
			warning.y = 135;
			warning.count = 0;
			warning.visible = true;
			warning.addEventListener( 'enterframe', function() {
				this.count++;
				if( this.count % sec( 0.5 ) == 0){
					if( this.visible ) this.visible = false; else this.visible = true;
				}
				if( this.count == sec( 6 ) ){
					dispMsg = false;
					eventNoDamage = true;
					eventLabel.color = "#ff0000";
					eventLabel.text = "隕石群通過中";
					stage.removeChild( msg1 );
					stage.removeChild( msg2 );
					stage.removeChild( this );
					delete msg1;
					delete msg2;
					delete this;
				}
			});
			stage.addChild( warning );
		}

		//イトカワ到着メッセージ表示
		/////////////////////////////////////////////////////////////////////////////
		var dispReachItokawa = function(){
			dispMsg = true;
			startFrame = game.frame;
			eventLabel.color = "#ffffff";
			eventLabel.text = "イトカワ到達";
			//メッセージ表示
			var msg1 = new Label( "イトカワに到着しました" );
			msg1.x = 90;
			msg1.y = 120;
			msg1.color = "#ffffff";
			stage.addChild( msg1 );
			var msg2 = new Label( "サンプルを採取後、地球に帰還します" );
			msg2.x = 60;
			msg2.y = 190;
			msg2.color = "#ffffff";
			stage.addChild( msg2 );
			var warning = new Sprite( 320, 50 );
			warning.image = game.assets['reach.gif'];
			warning.x = 0;
			warning.y = 135;
			warning.count = 0;
			warning.visible = true;
			warning.addEventListener( 'enterframe', function() {
				this.count++;
				if( this.count % sec( 0.5 ) == 0){
					if( this.visible ) this.visible = false; else this.visible = true;
				}
				if( this.count == sec( 6 ) ){
					dispMsg = false;
					stage.removeChild( msg1 );
					stage.removeChild( msg2 );
					stage.removeChild( this );
					delete msg1;
					delete msg2;
					delete this;
				}
			});
			stage.addChild( warning );
		}

		//イベントノーダメージボーナス表示		
		/////////////////////////////////////////////////////////////////////////////
		var dispBonusMsg = function( bonus ){
			score += bonus;
			var pt1 = new Text( 30, 100, "NO DAMAGE!" );
			pt1.count = sec( 3 );
			pt1.addEventListener( 'enterframe', function() {
				this.count--;
				if( this.count == 0 ){
					stage.removeChild( this );
					delete this;
				}
			});
			stage.addChild( pt1 );
			var pt2 = new Text( 30, 120, "BONUS " + bonus );
			pt2.count = sec( 3 );
			pt2.addEventListener( 'enterframe', function() {
				this.count--;
				if( this.count == 0 ){
					stage.removeChild( this );
					delete this;
				}
			});
			stage.addChild( pt2 );
		}

		//障害物投入
		/////////////////////////////////////////////////////////////////////////////
		var entryEnemy = function( kind, x, y, vx, vy ){
			enemy = new Sprite( 16, 16 );
			//宇宙放射線
			if( kind == 0 ){
				enemy.image = game.assets['icon0.gif'];
				enemy.frame = 30;
				enemy.scale = 8;
				enemy.scaleX = 0.5;
				enemy.scaleY = 0.5;
				if( eventSF && touchdown ){
					enemy.power = 150;		//弾幕の場合はダメージ半分
				}else{
					enemy.power = 300;
				}
				enemy.kind = 1;		//space radiation
			}
			//隕石（小）
			if( kind == 1 ){
				enemy.image = game.assets['map2.gif'];
				enemy.frame = 9;
				enemy.scale = 8;
				enemy.scaleX = 0.7;
				enemy.scaleY = 0.7;
				enemy.power = 500;
				enemy.kind = 0;		//meteorite
			}
			//隕石（大）
			if( kind == 2 ){
				enemy.image = game.assets['map2.gif'];
				enemy.frame = 9;
				enemy.scale = 16;
				enemy.scaleX = 1.5;
				enemy.scaleY = 1.5;
				enemy.power = 1000;
				enemy.kind = 0;		//meteorite
			}
			//隕石（特大）
			if( kind == 3 ){
				enemy.image = game.assets['map2.gif'];
				enemy.frame = 9;
				enemy.scale = 20;
				enemy.scaleX = 2.0;
				enemy.scaleY = 2.0;
				enemy.power = 1100;
				enemy.kind = 0;		//meteorite
			}

			//イベント中の当たり判定調整
			if( !touchdown && eventSF ){
				if( level == 0 )enemy.scale = Math.floor( enemy.scale * 0.8 );
			}
			if( touchdown && eventSF ){
				if( level < 4 )
					enemy.scale = Math.floor( enemy.scale * 0.8 );
				else
					enemy.scale = Math.floor( enemy.scale * 0.9 );
			}
			if( eventMT ){
				if( level < 4 )
					enemy.scale = Math.floor( enemy.scale * 0.6 );
				else
					enemy.scale = Math.floor( enemy.scale * 0.8 );
			}

			//クマー
			if( kind == 4 ){
				delete enemy;
				enemy = new Sprite( 32, 32 );
				enemy.image = game.assets['chara1.gif'];
				enemy.frame = 18;
				enemy.scale = 16;
				enemy.scaleX = 0.8;
				enemy.scaleY = 0.8;
				enemy.power = 0;
				enemy.kind = 2;		//item
			}
			enemy.x = x;
			enemy.y = y;
			enemy.vx = vx;
			enemy.vy = vy;
			enemy.rot = Math.floor( Math.random() * 6 ) - 3;
			enemy.rotation = Math.floor( Math.random() * 360 );
			stage.addChild( enemy );
			enemy.addEventListener( 'enterframe', function (){
				this.x += this.vx;
				this.y += this.vy;
//				this.rotation += this.rot;
				if( this.x < -20 || this.x > game.width + 20 || this.y < -20 || this.x > game.heigh + 20 ){
					stage.removeChild( this );
					delete this;
				}
				//自機との当たり判定
				if( this.within( player, this.scale ) && !event ){
					//障害物
					if( player.damaged == 0 ){
						if( this.kind == 0 || this.kind == 1 ){
							player.damage( this.power );	//ダメージ計算
							stage.removeChild( this );
							delete this;
						}
					}
					//回復アイテム（クマー）
					if( this.kind == 2 ){
						rescue++;
						if( rescue % 5 == 0 )level++;
						score += 1000;
						player.shield = 1000;
						player.propellant += 250;
						if( player.propellant > player.propellantMax )player.propellant = player.propellantMax
						stage.removeChild( this );
						delete this;
					}
				}
			});
		}	//function entryEnemy
	};
/*
	//パッド準備
	var pad = new Pad();
	pad.x = 120;
	pad.y = 220;
	game.rootScene.addChild( pad );
*/
	game.start();

};

