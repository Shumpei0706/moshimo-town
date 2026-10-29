# 提出要件

確認日: 2026-10-29 Asia/Tokyo（初回確認10/27）。ログイン済みの実提出フォーム・公式参加者ガイド・規約を再確認。説明等をブラウザーに下書き入力済み、同意は未チェック・未送信。サーバー側の下書き保存は未確認。

出典:
- https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit
- https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details
- https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver

## 実フォームの項目

|項目|必須表示|形式・備考|
|---|---|---|
|Team Name|あり|テキスト。ソロでも入力|
|Team Members|全貢献者の記載がガイドで必要|参加者追加。代表者が提出|
|Track|あり|Indie Developer Track / Startups Track の一つ。本案件はIndie予定|
|Problem statement|あり|Build for Your World / Push the Frontier。本案件は前者予定|
|X post link|なし|Most Viral賞に応募する場合|
|Project Description|あり|説明文|
|Public GitHub Repository|あり|公開GitHub URL|
|3-Minute Demo Video|あり|動画URL。YouTube URLが入力例。他サービスの対応可否は未検証|
|Describe your use of Meta products|あり|使用モデル・用途・実装方法|
|Why are Meta’s models important?|あり|解決策に対するMetaの重要性|
|Meta製品のフィードバック|なし|自由記述|
|パートナー技術のフィードバック|なし|Fireworks / Modal / Baseten等|
|利用許諾の同意|同意欄あり|MetaとCVによる提出物の利用・掲載・共有・宣伝|

文字数上限は画面・入力要素に見当たらないが、サーバー側制限がないとは断定しない。動画ファイルやZIPを直接添付する欄、ピッチ資料の提出欄、独立したライブ製品URL欄はなかった。

## 準備する成果物

1. 公開GitHub。起動手順、環境変数名、依存関係、データ・素材の出典とライセンス、実装済み機能と制約を記載。鍵・非公開情報を含めない。
2. 動くWebアプリ。公式ガイドではlive productも審査対象。URLは説明欄とREADMEに記載する方針。
3. 3分のデモ動画。期間中に実装した具体的機能・コード・動作を識別できるようにする。動画URLを第三者が視聴できることを検証。
4. 応募説明文。課題、対象ユーザー、Metaモデルの役割、独自性、制約を具体的に記述。

英語必須という表示は未確認。審査の伝わりやすさのため英語説明・英語字幕を準備するのは本プロジェクトの方針であり、公式義務ではない。

## 締切・選考

締切: 2026-11-04 21:00 EST = **2026-11-05 11:00 JST**。遅延提出不可。最大4人、1チーム1提出、1トラックのみ。
テーマ適合とMetaモデル実使用が一次合否。Impact30%、Meta tooling25%、Technical depth20%、Demo25%。最終審査は動画をライブ視聴との記載。登壇・出席義務が全くないとは断定せず、選出時に確認。

## 日程の扱い

大会トップは10/26 kickoffから開始と記載し、参加者ガイドはBuilding periodを10/27–11/4（ET）と記載している。正確な開発開始時刻は不明であり、10/27の0時を公式開始と断定しない。今回は自主的な余裕として10/27 14:00 JST以降に実装を開始する予定。新しい公式告知があれば見直す。

## 最終チェック

- [ ] 最新規約と追加告知を確認
- [ ] Meta実接続で主要機能を検証。モックを実APIとして見せない
- [ ] 実装日時と貢献を正確に説明できる
- [ ] データ・画像・依存コードの利用権と帰属表示を確認
- [ ] GitHub、動画、ライブ製品を第三者が閲覧できる
- [ ] 全メンバー・トラック・説明が正確
- [ ] 本人が利用許諾を確認して提出し、受付結果を確認

## 10月29日の提出準備状況

- 登録メンバー Shumpei Suzuki（Shumpei）を実フォームで確認。チーム名 Moshimo Town、Indie Developer Track、Build for Your World を入力。説明、Meta活用、重要性、任意Metaフィードバックも入力。
- 公開GitHub・動画URLは未発行のため空欄。任意X投稿・パートナーフィードバックも空欄。
- 176秒のfocus-v2動画を書き出し済み。原稿では期間中に作った設備編集・営業エンジン・比較再生・Museツール処理を明示。地図案から検証可能な店内配置へ絞った経緯を説明。
- 新しい公開用ソースは内部指示・規約全文・秘密・履歴・旧アーカイブを除くスナップショットで準備。元の開発履歴は実チェックアウト内に保持。コードの公開ライセンスは本人の選択前に付与しない。
- 公式規約の所有・主催者利用許諾の主要段落は10/27保存版と同内容を確認。Discord追加告知はこの確認に含まない。
- 公開、ホストへの秘密設定、有料プラン、動画アップロード、最終利用許諾・送信は未実施。
