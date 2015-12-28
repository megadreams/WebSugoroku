'use strict';

function Sugoroku() {

}



/**
 *
 * すごろくを実施するユーザ名
 * @param userId   ユーザID
 * @param userName ユーザ名
 * @param imageObj {imgUrl: '', isAnimation: false}
 *
 */
function SugorokuUser(userId, userName, imageObj) {
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
  this.userImageUrl = (imageObj)?imageObj.imgUrl: 'sample_user.png';

  /**
   * ユーザ画像はアニメーションさせる必要があるか
   */
  this.isUserImageAnimation = (imageObj)?imageObj.isAnimation: false;;

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

  /**
   * 移動するときのアニメーションの有無
   */
  this.isAnimation = false;

  /**
   * 移動するときの移動先を指定する
   */
  this.setMovePosition = function(x, y, z) {
    this.position.x = (x)?x:this.movePosition.x;
    this.position.y = (y)?y:this.movePosition.y;
    this.position.z = (z)?z:this.movePosition.z;

    // 移動する場合は基本的にアニメーションさせる
    this.isAnimation = true;
  };

  /**
   * 位置情報を更新する
   */
  this.setCurrentIndex = function(index) {
    
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
 *      tag: 'panel01',
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
function SugorokuPanel(panelObj) {

  // スゴロクで利用するパネルリスト
  this.panelList = panelObj;

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
    if (this.getPanelLength() >= index) {
      return 0;
    }
    return index++;
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
   * 指定された位置情報を返す
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

}
