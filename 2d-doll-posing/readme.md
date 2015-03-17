2d-doll-posing
====
Preview: http://n-yoda.github.io/2d-doll-posing/pose.html

----

学部4年夏学期「ユーザインターフェイス」の課題

２Ｄキャラクタのポーズを操作するユーザインタフェースをデザイン・実装し、ユーザテストを行う

http://www-ui.is.s.u-tokyo.ac.jp/~takeo/course/2014/ui/assignment.htm	

##  概要
キャラクターを紙に印刷し、切り取って関節をつなげ、実際に関節を手で動かし、Webカメラでスキャンすることでポーズを入力するUI。
実装的には、Chilitags を使っているだけ。
![demo](demo.png?raw=true)

## 使い方

* まず[doll.pdf](http://n-yoda.github.io/2d-doll-posing/doll.pdf)を厚めの紙に印刷し、灰色の線に従って切り取る。
* より胴体に近いものが下になるようにして、関節を回転可能な器具でとめる
	* http://www.amazon.co.jp/%E3%83%8B%E3%83%95%E3%82%B3-%E6%A8%B9%E8%84%82%E3%83%8F%E3%83%88%E3%83%A1-RV6-%E9%BB%92-5%E7%B5%84%E5%85%A5/dp/B0091G4BXG/ref=sr_1_8?s=diy&ie=UTF8&qid=1400612235&sr=1-8&keywords=%E3%83%8F%E3%83%88%E3%83%A1+%E6%A8%B9%E8%84%82
	* フェルトを挟むと良い。 
* pose.htmlを開き、ブラウザのWebカメラを有効にする。
* 紙のキャラクターのポーズを調整する。
* スペースキーを押して、紙キャラクターをカメラに写す。
* 画面左のキャラクターの位置が望んだ状態になっていることを確認し、再びスペースキーを押す。
* 微修正が必要なら、画面左のキャラクターをドラッグ＆ドロップで回転させる。
* 画面左の白い部分をドラッグ＆ドロップすると、キャラクターの表示位置が変わる。

## 使ったもの
* Chilitags
	* https://github.com/chili-epfl/chilitags
* gl-matrix
	* https://github.com/toji/gl-matrix

## TODO
* 辺上に8つも配置したタグを座標計算にまともに使っていないので、紙に角度が付くと辛い。
