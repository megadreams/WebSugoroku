'use strict';

/**
 * WebGLで表現する際にThreejsを利用したの設定クラス
 *
 */
function ServiceThreejs (selector, width, height) {
  this.selector = selector;
  this.width  = width;
  this.height = height;

  // Three.jsの描画で利用する変数
  this.canvasFrame;
  this.renderer;
  this.scene;
  this.camera;
  this.controls;
  this.clock;
  this.stats;

  // アニメーション設定
  this.animationCharacterList = [];
  this.characterList = [];

  /**
   * 画面の初期化
   * options = {
   *
   *  isCanvas: true,            // WebGLではなくcanvasを利用する場合
   *  backgroundColor: x0000000,
   *  backgroundOpacity: 0,
   * }
   */
  this.initView = function(options) {

    // 引数の初期化
    options = options || {}
    options.isCanvas = options.isCanvas || false;

    // キャンバスフレームDOM要素の取得
    this.canvasFrame = document.querySelector(this.selector);

    // レンダラーを作成
    // WebGLに対応していない場合はCanvasを利用する
    if (options.isCanvas || !window.WebGLRenderingContext ) {
      this.renderer = new THREE.CanvasRenderer();
      console.log('===canvas===');
      $('#js-view-type').text("canvas");
    } else {
      this.renderer = new THREE.WebGLRenderer({antialias: true});
      console.log('===WebGL===');
      $('#js-view-type').text("WebGL");
    }

    // canvas要素のサイズを設定
    this.renderer.setSize(this.width, this.height);

    // 背景色の設定があれば
    if (options.backgroundColor) {
      var backgroundOpacity = options.backgroundOpacity || 0;
      this.renderer.setClearColor(options.backgroundColor, backgroundOpacity);
    }

    // body要素にcanvas要素を追加
    this.canvasFrame.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // 画面リサイズ時のイベントを付与
    window.addEventListener('resize', this._onWindowResize, false);
  };

  /**
   * 画面リサイズが走った時に比率を調整するために設定
   */
  this._onWindowResize = function() {
    if (this.camera) {
      // アスペクト比を設定
      this.camera.aspect = window.innerWidth / window.innerHeight;
      // カメラの設定を更新
      this.cameracamera.updateProjectionMatrix();
      // canvas要素のサイズを設定
      this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
  }


  /**
   * シーンの初期化
   */
  this.initScene = function(options) {

    // 引数の初期化
    options = options || {}
    options.isGridHelper = options.isGridHelper || false;
    options.isAxisHelper = options.isAxisHelper || false;
    options.isStats = options.isStats || false;

    // シーンの作成
    this.scene = new THREE.Scene();

    // GridHelperの表示切り替え
    if (options.isGridHelper) {
      // THREE.GridHelper(大きさ, １マスの大きさ);
      var grid = new THREE.GridHelper(this.width, 10);
      this.scene.add(grid);
    }

    // isAxisHelper
    if (options.isAxisHelper) {
      var axis = new THREE.AxisHelper(1000);
      axis.position.set(0,0,0);
      this.scene.add(axis);
    }

    if (options.isStats) {
      this.stats = new Stats();
      this.stats.domElement.style.position = 'absolute';
      this.stats.domElement.style.top = '0px';
      this.stats.domElement.style.zIndex = 100;
      document.body.appendChild(this.stats.domElement);
    }

    // ライトの設定
    var ambient = new THREE.AmbientLight(0xffffff);
    this.scene.add(ambient);

  };

  /**
   * カメラの設定
   */
  this.initCamera = function(options) {
    // 引数の初期化
    options = options || {};
    /// 位置指定
    options.potision = options.potision || {x:-45, y:45, z:45};
    /// カメラを移動させられるか
    options.isMove = options.isMove || true;
    // カメラの移動詳細設定
    options.moveOption = options.moveOption || {enableZoom:true, enableRotate:false, enablePan:true};

    // カメラの投影距離
    options.projectionDistance = options.projectionDistance || true;


    // カメラを作成 :透視投影
    this.camera = new THREE.PerspectiveCamera(options.projectionDistance, this.width / this.height, 2, 1000);
    // カメラの位置を設定
    this.camera.position.set(options.potision.x, options.potision.y, options.potision.z);

    // カメラの向きを設定
    if (options.isMove) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableZoom   = options.moveOption.enableZoom;
      this.controls.enableRotate = options.moveOption.enableRotate;
      this.controls.enablePan    = options.moveOption.enablePan;
    } else {
      this.camera.lookAt( {x: 0, y: 0, z: 0} );
    }
  };

  /**
   * 3D空間に立方体のTextureObjectを表示する
   * {
   *   imgUrl  : '',
   *   size    : {x:0, y:0, z:0},
   *   position: {x:0, y:0, z:0}
   * }
   */ 
  this.addTextureObject = function(textureObject) {
    // 引数が無ければ何もしない
    if (!textureObject) return false;
    textureObject.imgUrl   = textureObject.imgUrl || '';
    textureObject.size     = textureObject.size || {x:0, y:0, z:0};
    textureObject.position = textureObject.position || {x:0, y:0, z:0};

    var texture = THREE.ImageUtils.loadTexture(textureObject.imgUrl);
    texture.anisotropy = this.renderer.getMaxAnisotropy();
    // マテリアルオブジェクトを作成
    var material = new THREE.MeshBasicMaterial({ map: texture });
    // 立方体の作成(x,y,zの大きさを入れる)
    var geometry = new THREE.BoxGeometry(textureObject.size.x, textureObject.size.y, textureObject.size.z);

    var object = new THREE.Mesh(geometry, material);
    object.position.set(textureObject.position.x, textureObject.position.y, textureObject.position.z);
    this.scene.add(object);
  };



  /**
   * ユーザオブジェクトの設定を行う
   *
   */
  this.addTextureAnimatorObject = function (options){
    // 引数が無ければ何もしない
    if (!options) return false;
    options.userId        = options.userId  || '';
    options.imgUrl        = options.imgUrl  || '';
    options.tagName       = options.tagName || 'TextureAnimatorObject';
    options.animateOption = options.animateOption || {horiz:10, vert:1, total:10, duration:75};
    options.geometry      = options.geometry || {width:15, height:15, x:1, y:1};
    options.position      = options.position || {x:15, y:15, z:1};
    options.rotation      = options.rotation || {x:0, y:Math.PI, z:0};
    options.isMoveAnimation = options.isMoveAnimation || false;
    options.movePosition  = options.movePosition || {x:0, y:0, z:0};
    options.cb            = options.cb       || function(){ console.log('animation');};



    // キャラクター
    var runnerTexture = new THREE.ImageUtils.loadTexture(options.imgUrl);

    // texture, #horiz, #vert, #total, duration.
    var runnerAnnie = new TextureAnimator(
                            runnerTexture,
                            options.animateOption.horiz,
                            options.animateOption.vert,
                            options.animateOption.total,
                            options.animateOption.duration);
    this.animationCharacterList.push(runnerAnnie);

    var runnerMaterial = new THREE.MeshBasicMaterial( { map: runnerTexture, side:THREE.DoubleSide, transparent: true } );


    var runnerGeometry = new THREE.PlaneGeometry(
                            options.geometry.width,
                            options.geometry.height,
                            options.geometry.x,
                            options.geometry.y);
    var runner = new THREE.Mesh(runnerGeometry, runnerMaterial);
    runner.position.set(options.position.x, options.position.y, options.position.z);
    runner.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z);


    // 独自設定
    runner.userId      = options.userId;
    runner.isAnimation = options.isMoveAnimation;

    runner.movePosition = {
      x: options.movePosition.x,
      y: options.movePosition.y,
      z: options.movePosition.z
    };

    runner.cb      = options.cb;
    runner.cb      = options.cb;
    runner.tagName = options.tagName;

    // SugorokuUserオブジェクトのコピーがCharacterListにはいる
    // そのため、アニメーションや位置の更新をする際には
    // この配列のrunnerオブジェクトの値を更新する必要がある
    this.characterList.push(runner);
    this.scene.add(runner);
  };

  /**
   *
   */
  this.render = function() {
    // requestAnimationFrame の中のcontextをこのクラス自身にする必要がある
    // 参考: http://stackoverflow.com/questions/6065169/requestanimationframe-with-this-keyword
    requestAnimationFrame(this.render.bind(this));


    // カメラ情報の更新
    if (this.controls) {
      this.controls.update();
    }
    
    // fpsの更新
    if (this.stats) {
      this.stats.update();
    }

    // Characterのアニメーションがある場合
    var delta = this.clock.getDelta();
    for (var i=0;i<this.animationCharacterList.length;i++) {
      this.animationCharacterList[i].update(1000 * delta);
    }

    // MoveChara
    for (var i=0;i<this.characterList.length;i++) {
      if ($.isFunction(this.characterList[i].cb)) {
        // なぜかrunner.cbが実行されないです
        // 複雑すぎてよく分からなくなってきたので終了
        this.characterList[i].cb();
      }
    }



    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  };


  /**
   * アニメーションオブジェクトの更新を行う
   */
  this.updateRunnerObject = function(userId, options) {
    if (!userId) return false;
    if (!options) return false;

    var index, runner;
    // 対象のオブジェクトを取得する
    for (var i=0;i<this.characterList.length;i++) {
      if (this.characterList[i].userId === userId) {
        index = i;
        runner = this.characterList[index];
        break;
      }
    }

    // 対象のオブジェクトが見つかればデータの上書きを行う
    if (runner) {
      if (options.position) {
        runner.movePosition.x = options.position.x;
        runner.movePosition.y = options.position.y;
        runner.movePosition.z = options.position.z;
        runner.isMoveAnimation = options.isMoveAnimation || true;
      }
      this.characterList[index] = runner;
    }



  };
}


/**
 * スプライト画像をアニメーションさせるためのクラス
 *
 * 下記より参考
 * - https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/Texture-Animation.html
 *
 */
function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{
  // note: texture passed by reference, will be updated by the update function.

  this.tilesHorizontal = tilesHoriz;
  this.tilesVertical = tilesVert;
  // how many images does this spritesheet contain?
  //  usually equals tilesHoriz * tilesVert, but not necessarily,
  //  if there at blank tiles at the bottom of the spritesheet. 
  this.numberOfTiles = numTiles;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
  texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );
  // how long should each image be displayed?
  this.tileDisplayDuration = tileDispDuration;
  // how long has the current image been displayed?
  this.currentDisplayTime = 0;
  // which image is currently being displayed?
  this.currentTile = 0;

  this.update = function( milliSec )
  {
      this.currentDisplayTime += milliSec;
      while (this.currentDisplayTime > this.tileDisplayDuration)
      {
          this.currentDisplayTime -= this.tileDisplayDuration;
          this.currentTile++;
          if (this.currentTile == this.numberOfTiles)
              this.currentTile = 0;
          var currentColumn = this.currentTile % this.tilesHorizontal;
          texture.offset.x = currentColumn / this.tilesHorizontal;
          var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
          texture.offset.y = currentRow / this.tilesVertical;
      }
  };
}



/**
 * 実施するスゴロクゲームを管理する
 *
 */
function Sugoroku(userList) {

  /**
   * 参加しているユーザ
   */
  this.userList = userList;

  /**
   * 現在のターンのユーザ
   *  
   */
  this.currentUserIndex = 0;

  /**
   * ユーザを追加する
   */
  this.addUser = function(user) {
    this.userList.push(user);
  };

  /**
   * 現在のユーザを取得する
   */
  this.getCurrentUser = function() {
    return this.userList[this.currentUserIndex];
  };

  /**
   * 現在のユーザ情報を更新する
   */
  this.updateCurrentUser = function(user) {
    return this.userList[this.currentUserIndex] = user;
  };

  /**
   * サイコロをふる
   */
  this.turnTheDice = function() {
    return Math.floor(Math.random()*6)+1;
  };

  /**
   * 次のユーザに遷移する
   */
  this.nextUser = function() {
    this.currentUserIndex++;
    if (this.userList.length <= this.currentUserIndex) {
      this.currentUserIndex = 0;
    }
    return this.getCurrentUser();
  }


}



/**
 *
 * すごろくを実施するユーザオブジェクト
 *  1ユーザ1オブジェクトを保持する
 * @param userId   ユーザID
 * @param userName ユーザ名
 * @param imageObject {imgUrl: '', isAnimation: false}
 *
 */
function SugorokuUser(userId, userName, imageObject) {


  /**
   * ユーザID
   */
  this.userId   = userId;

  /**
   * ユーザ名
   */
  this.userName = userName;

  /**
   * 空間に表示する画像
   */
  this.userImageUrl = (imageObject)?imageObject.imgUrl: 'img/run.png';

  /**
   * ユーザ画像はアニメーションさせる必要があるか
   */
  this.isUserImageAnimation = (imageObject)?imageObject.isAnimation: false;;

  /**
   * 現在のパネル位置
   */
  this.currentIndex = 0;

  /**
   * すごろくのパネルを何周回ったか
   */
  this.laps = 0;

  /**
   * すごろくの3D空間に表示される位置
   */
  this.position = {
    x: 0,
    y: 0,
    z: 0
  };

  /**
   * すごろくの3D空間を移動するとき
   * 移動先を下記に指定する
   */
  this.movePosition = {
    x: 0,
    y: 0,
    z: 0
  };
  this.rotation = {
    x:0,
    y:Math.PI,
    z:0
  };
  /**
   * 移動するときのアニメーションの有無
   */
  this.isMoveAnimation = false;

  /**
   * スゴロクClassに渡すベースのキャラクター情報
   *  シングルトンのため、positionやmovePositionが変更されれば
   *  charaObjectも変更される
   *
   *  また、3D空間に表示するために下記オブジェクトを渡すが
   *  メモリ上は共有しているので下記を変更すれば反映される
   */
  this.charaObject = {
    userId: this.userId,
    tagName: userName,
    imgUrl: this.userImageUrl,
    // texture, #horiz, #vert, #total, duration.
    animateOption: {
      horiz: 10,   // 終了位置
      vert: 1,     // 表示位置
      total: 10,   // 合計枚数
      duration: 75 // 切り替え時間
    },
    geometry: {
      width: 15,
      height: 15,
      x:1,
      y:1
    },
    // 表示位置設定
    position: this.position,
    // 表示角度
    rotation: this.rotation,
    // アニメーション設定
    isMoveAnimation: this.isMoveAnimation,
    // 移動先
    movePosition: this.movePosition,
    cb: function() {
      var direct;

      if (this.isMoveAnimation || false) {
        var isMoveAnimation = false;
        // 0で無ければ移動
        if ((this.position.x - this.movePosition.x) !== 0) {
          isMoveAnimation = true;
          // 正負どちらに移動するか
          if ((this.movePosition.x - this.position.x) > 0) {
            this.position.x++;
            direct = 'right';
          } else {
            this.position.x--
            direct = 'left';
          }
        }
        // 0で無ければ移動
        if ((this.position.y - this.movePosition.y) !== 0) {
          isMoveAnimation = true;
          // 正負どちらに移動するか
          if ((this.movePosition.y - this.position.y) > 0) {
            this.position.y++;
          } else {
            this.position.y--
          }
        }
        // 0で無ければ移動
        if ((this.position.z - this.movePosition.z) !== 0) {
          isMoveAnimation = true;
          // 正負どちらに移動するか
          if ((this.movePosition.z - this.position.z) > 0) {
            this.position.z++;
            direct = 'up';
          } else {
            this.position.z--
            direct = 'down';
          }
        }

        // 回転する必要があるか？
          switch(direct) {
            case 'up':
              this.rotation.y = Math.PI/2;
              break;
            case 'down':
              this.rotation.y = -Math.PI/2;
              break;
            case 'right':
              this.rotation.y = Math.PI;
              break;
            case 'left':
              this.rotation.y = 0;
              break;
          }
      }
      this.isMoveAnimation = isMoveAnimation;
    }
  };

  /**
   * 移動するときの移動先を指定する
   */
  this.setMovePosition = function(x, y, z) {
    this.position.x = (x)?x:this.movePosition.x;
    // y座標は人の高さを追加する必要があるので基本動かさない
//    this.position.y = (y)?y:this.movePosition.y;
    this.position.z = (z)?z:this.movePosition.z;

    // 移動する場合は基本的にアニメーションさせる
    this.isMoveAnimation = true;
  };

  /**
   * 位置情報をセットする
   */
  this.setPosition = function (x, y, z) {
    this.position.x = (x)?x:0;
    this.position.y = (y)?y:0;
    this.position.z = (z)?z:0;
  };

}
/**
 * @params panelObj [
 *    {
 *      tagName: 'panel01',
 *      img: 'img/crate.gif',
 *      position: {
 *        x: 0,
 *        y: 0,
 *        x: 0
 *      },
 *      // マスに止まった時に実行されるメソッド
 *      callback: function() {
 *        alert('止まったよー');
 *      },
 *    }
 * ]
 */
function SugorokuPanel() {

  this.basePanel = {
    tagNameName: 'panel',
    imgUrl: 'img/crate.gif',
    size: {
      x: 10,
      y:  1,
      z: 10
    },
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    // マスに止まった時に実行されるメソッド
    callback: function() {
      console.log('止まったよー');
    }
  };

  this.panelList = [];

  /**
   * ベースとなるパネルオブジェクトを返す
   */
  this.getBaseObject = function() {
    // DeepCopyで返す
    // http://api.jquery.com/jQuery.extend/
    return $.extend(true, {}, this.basePanel);
  };

  /**
   * すごろくパネルを格納する
   */
  this.addPanel = function(panel) {
    this.panelList.push(panel);
  };


  /**
   * パネルの数を返す
   */
  this.getPanelLength = function() {
    return this.panelList.length;
  };

  /**
   * 次のパネルのIndex情報を返す
   */
  this.nextPanelIndex = function(index) {
    // パネルの配列数を超えた場合は、最初にもどる
    if (this.getPanelLength() <= index) {
      return 0;
    }
    return ++index;
  }

  /**
   * 指定された位置のパネルを返す
   * - パネルが存在しない場合はfalseを返す
   */
  this.getPanel = function(index) {
    if (this.getPanelLength() > index) {
      return this.panelList[index];
    }
    return false;
  };

  /**
   * 指定されたパネルの位置情報を返す
   */
  this.getPannelPosition = function(index) {
    var panel = this.getPanel(index);
    if (panel) {
      if (panel.position) {
        return panel.position;
      }
    }
    return {};

  }

  /**
   * 指定された位置のパネルに設定されている
   * 効果を実施する
   *
   */
  this.execPanelCallback = function(index) {
    var panel = this.getPanel(index);
    if (panel) {
      if (panel.callback) {
        panel.callback();
      }
    }
  };

  /**
   * デフォルトでパネルのオブジェクトを作る
   * 
   * @param x 横軸
   * @param y 縦軸
   * @param width 正方形の1マスの1辺の長さ
   */
  this.setPanel = function(x, y, width) {
    var width = width || 10;

    var index = 0;

    // ベースオブジェクトを作成
    var obj = this.getBaseObject();
    obj.tagName += '_' + (index++);
    this.addPanel(obj);

    // 右にx進む
    for (var i =1; i<x; i++) {
      var obj = sugorokuPanel.getBaseObject();
      obj.position.x = i * width;
      obj.tagName += '_' + (index++);
      sugorokuPanel.addPanel(obj);
    }

    // 奥にy進む
    for (var j =1; j<y; j++) {
      var obj = sugorokuPanel.getBaseObject();
      obj.position.x = (x-1)*width;  // 4*4の時は30が入る
      obj.position.z = -j*width;
      obj.tagName += '_' + (index++);
      sugorokuPanel.addPanel(obj);
    }

    // 左にx進む
    for (var k =1; k<x; k++) {
      var obj = sugorokuPanel.getBaseObject();
      obj.position.x = ((x-1)*width) - (k*width); // 4*4の時は30-(k*10)
      obj.position.z = -(y-1) * width;
      obj.tagName += '_' + (index++);
      sugorokuPanel.addPanel(obj);
    }

    // 手前にx-1進む
    for (var l=1; l<(y-1); l++) {
      var obj = sugorokuPanel.getBaseObject();
      obj.position.z = (-(y-1) * width) + l*width; // 4*4の時は-30 + l*10
      obj.tagName += '_' + (index++);
      sugorokuPanel.addPanel(obj);
    }
  };

}
