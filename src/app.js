/****************************************************************************
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.
 
 http://www.cocos2d-x.org
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

const TARGET_BALLS_COUNT = 10;

const TAGS = {
  SHOOTING_GUN: 1,
  TARGET_BALLS_LAYER: 2,
  BALL_START: 50,
  FORWARD: 3,
};

const TargetBall = cc.Sprite.extend({
  ctor: function (imageFile, position = cc.p(0, 0), tag) {
    this._super(imageFile);
    this.setPosition(position);
    this.setTag(tag);
  },
  onEnter: function () {
    this._super();
  },
  onExit: function () {
    this._super();
  },
  makeDisappear: function () {
    this.setScale(0, 0);
  },
});

const ShootingGun = cc.Sprite.extend({
  forward: cc.p(0, 0),
  ctor: function (imagefile, position = cc.p(0, 0)) {
    this._super(imagefile);
    this.setPosition(position);
    this.forward = cc.p(0, this.getContentSize().height * 0.5);
  },

  onEnter: function () {
    this._super();
  },

  onExit: function () {},

  shoot: function () {},

  turn: function (direction, callback, bind = {}) {
    const rotateByAction = cc.rotateBy(0.2, -cc.pAngleSigned(this.forward, direction) * 57.2958);
    this.runAction(cc.sequence(rotateByAction, cc.callFunc(callback, bind)));
    this.forward = direction;
  },
});

const TargetBallsLayer = cc.Layer.extend({
  targetBallsSprite: [],
  ctor: function (size = cc.winSize, position = cc.p(0, 0)) {
    this._super();
    this.setContentSize(size);
    this.setPosition(position);
  },

  onEnter: function () {
    this._super();
    this.renderBalls();
  },

  onExit: function () {
    this._super();
  },

  getRandomIntInclusive: function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
  },

  generateRandomPosition: function (minX, minY, maxX, maxY) {
    return cc.p(this.getRandomIntInclusive(minX, maxX), this.getRandomIntInclusive(minY, maxY));
  },

  renderBalls: function () {
    for (let i = 1; i <= TARGET_BALLS_COUNT; ++i) {
      const randomPosition = this.generateRandomPosition(
        0,
        0,
        this.getContentSize().width,
        this.getContentSize().height
      );
      const targetBallSprite = new TargetBall(res.TargetBall_png, randomPosition, TAGS.BALL_START + (i - 1));
      this.targetBallsSprite.push(targetBallSprite);
      this.addChild(targetBallSprite);
    }
  },

  // sourcePosition in world space
  getNearestBallData: function (sourcePosition = cc.p(0, 0)) {
    const nearestBall = this.targetBallsSprite.reduce((currentNearestBall, currentBall) => {
      const currentNearestBallDist = cc.pDistance(
        this.convertToWorldSpace(currentNearestBall.getPosition()),
        sourcePosition
      );
      const currentBallDist = cc.pDistance(this.convertToWorldSpace(currentBall.getPosition()), sourcePosition);
      return currentBallDist < currentNearestBallDist ? currentBall : currentNearestBall;
    });
    return {
      tag: nearestBall.getTag(),
      position: this.convertToWorldSpace(nearestBall.getPosition()),
    };
  },

  makeBallDisappearByTag: function (tag) {
    const ball = this.getChildByTag(tag);
    ball.makeDisappear();
    this.targetBallsSprite.splice(
      this.targetBallsSprite.findIndex((currentBall) => currentBall === ball),
      1
    );
  },
});

var MainLayer = cc.Layer.extend({
  ctor: function () {
    this._super();
  },

  onEnter: function () {
    this._super();
    this.renderShootingGun();
    this.renderTargetBalls();
    this.renderShootButton();
  },

  onShoot: function (sender, type) {
    switch (type) {
      case ccui.Widget.TOUCH_ENDED: {
        sender.setEnabled(false);
        const targetBallsLayer = this.getChildByTag(TAGS.TARGET_BALLS_LAYER);
        const shootingGun = this.getChildByTag(TAGS.SHOOTING_GUN);
        const nearestBallData = targetBallsLayer.getNearestBallData(shootingGun.getPosition());
        shootingGun.turn(
          cc.pSub(nearestBallData.position, shootingGun.getPosition()),
          () => {
            targetBallsLayer.makeBallDisappearByTag(nearestBallData.tag)
            sender.setEnabled(true);
          },
          this
        );
      }
    }
  },

  renderShootButton: function () {
    const shootButton = new ccui.Button();
    shootButton.setPosition(cc.p(cc.winSize.width * 0.8, cc.winSize.height * 0.1));
    shootButton.setTitleText("SHOOT");
    shootButton.setTitleFontSize(30);
    shootButton.addTouchEventListener(this.onShoot, this);
    this.addChild(shootButton);
  },

  renderTargetBalls: function () {
    const targetBallsLayer = new TargetBallsLayer(
      cc.size(cc.winSize.width, cc.winSize.height * 0.7),
      cc.p(0, cc.winSize.height * 0.3)
    );
    targetBallsLayer.setTag(TAGS.TARGET_BALLS_LAYER);
    this.addChild(targetBallsLayer);
  },

  renderShootingGun: function () {
    const shootingGunSprite = new ShootingGun(res.Triangle, cc.p(cc.winSize.width * 0.5, cc.winSize.height * 0.2));
    shootingGunSprite.setTag(TAGS.SHOOTING_GUN);
    this.addChild(shootingGunSprite);
  },
});

var MaindScene = cc.Scene.extend({
  onEnter: function () {
    this._super();
    var layer = new MainLayer();
    this.addChild(layer);
  },
});
