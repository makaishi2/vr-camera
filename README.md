# Visual Recognition サンプルアプリ 

このアプリケーションはVisual Recognitionの機能を簡単に確認するためのサンプルアプリケーションです。  
次の特徴を持っています。

* 日本語対応
* スマホから撮った写真をすぐに解析可能  
ブラウザのアプリケーションですが、iPhone/iPadの場合、Safariを使うことでカメラの利用が可能です。
* 複数の機能を同時に呼出し可能  
一つのイメージに対して以下の機能を同時に呼び出すことが可能です。  
どの機能を呼び出すかは、画面のチェックボックスで指定します。

対応している機能  

* 一般種別 (分類器名=default)
* 一般種別 (分類器名=food)
* カスタム分類器
* 顔認識
* 文字認識

デモ画面  
![デモ](readme_images/vr-demo.gif)

## 事前準備

* Bluemixアカウントの準備
    * [Bluemixアカウントを作る][sign_up] か、あるいは既存のBluemixアカウントを利用します。
* 次の前提ソフトを導入します。
    *  [git][git] コマンドラインツール
    *  [Cloud Foundry][cloud_foundry] コマンドラインツール

      注意: Cloud Foundaryのバージョンは最新として下さい。

### Visual Recognitionサービスの作成
Bluemixにログインし、サービスの中からVisual Recognitionを選んで作成します。  
  
![](readme_images/crt-vr-step1.png)  
  
サービス名は vr-service-1を指定し、プランはデフォルトの無料のものを選択します。  
  
![](readme_images/crt-vr-step2.png)  
  

## ソースのダウンロード
git cloneコマンドは、カレントディレクトリのサブディレクトリにソースがダウンロードされるので、あらかじめ適当なサブディレクトリを作り、そこにcdしてから下記のコマンドを実行します。

    git clone https://git.ng.bluemix.net/akaishi/vr-camera.git

## Bluemix環境へのデプロイ
cf loginコマンドではemailとpasswordを聞かれるのでbluemix登録時のemailアドレスとパスワードを指定します。  
cf pushコマンドで指定するyour_appl_nameはBluemix上のインスタンス名であると同時に、インターネット上のURL名にもなるので、ユニークなものを指定します。  

    cd vr-camera
    cf api https://api.ng.bluemix.net/
    cf login
    cf push <your_appl_name>
デプロイが完了したら、サンプルアプリケーションが利用できるはずです。  
既存のVRインスタンスを使いたい場合は、manifest.yml内の記載を変更するか、Bluemix管理画面でバインド先サービスの設定を行って下さい。  
  
カスタム分類器も使いたい場合は、以下の手順に従って下さい。

## 環境変数の設定 (オプション)
事前にカスタム分類器のIDを調べておき、下記の手順で環境変数に設定します。

    cf set-env <your_appl_name> classifier_id xxxxxxxxxxxx
    cf restage <your_appl_name>
restageコマンドの後で再構成が行われます。再構成完了後には、カスタム分類器が利用可能になっています。

## (参考)サンプルイメージ
sample_images配下にテスト用のサンプルイメージが入っていて、動作確認に利用可能です。

[cloud_foundry]: https://github.com/cloudfoundry/cli#downloads
[git]: https://git-scm.com/downloads
[sign_up]: https://bluemix.net/registration

