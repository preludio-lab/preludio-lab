# 作曲家マスターデータ作成 対象リスト

`src/domain/shared/musical-era.ts` の区分準拠。
人気のある作曲家を中心に、マスターデータ作成の進捗を管理するためのリストです。

## 凡例

- `[ ]`: 未着手
- `[/]`: 作成中
- `[x]`: 完了（レビュー済み）

### Slug 生成ルール

1. **原則 (Default)**: 姓（Surname）のみを lower-kebab-case で使用。
   - 例: `beethoven`, `mozart`, `chopin`
2. **重複発生時 (Conflicts)**: フルネーム（Full Name）を lower-kebab-case で使用。イニシャル等の略称は避ける。
   - 例: `johann-christian-bach` (not `jc-bach`), `domenico-scarlatti`
3. **知名度による予約 (Naming Privilege)**: 同姓で圧倒的に知名度が高い一人がいる場合、その人物に「姓のみ」を予約し、他方はフルネームとする。
   - 例: `mendelssohn` (Felix) / `fanny-mendelssohn`
   - 例: `schumann` (Robert) / `clara-schumann`

### Priority

- **P0**: 1-10
- **P1**: 11-30
- **P2**: 31-60
- **P3**: 61-最後

## P0 (1-10)

| Status | Era                           | Name (JP)                                | Slug                  | Birth-Death | 備考                |
| :----: | :---------------------------- | :--------------------------------------- | :-------------------- | :---------- | :------------------ |
|  [/]   | バロック (Baroque)            | アントニオ・ヴィヴァルディ               | vivaldi               | 1678-1741   |                     |
|  [x]   | バロック (Baroque)            | ヨハン・セバスティアン・バッハ           | johann-sebastian-bach | 1685-1750   | Conflicts with sons |
|  [/]   | 古典派 (Classical)            | フランツ・ヨーゼフ・ハイドン             | haydn                 | 1732-1809   |                     |
|  [x]   | 古典派 (Classical)            | ヴォルフガング・アマデウス・モーツァルト | mozart                | 1756-1791   |                     |
|  [x]   | 古典派 (Classical)            | ルートヴィヒ・ヴァン・ベートーヴェン     | beethoven             | 1770-1827   |                     |
|  [x]   | 前期ロマン派 (Early Romantic) | フランツ・シューベルト                   | schubert              | 1797-1828   |                     |
|  [x]   | 前期ロマン派 (Early Romantic) | フレデリック・ショパン                   | chopin                | 1810-1849   |                     |
|  [/]   | 中期ロマン派 (Mid Romantic)   | ヨハネス・ブラームス                     | brahms                | 1833-1897   |                     |
|  [/]   | 後期ロマン派 (Late Romantic)  | ピョートル・イリイチ・チャイコフスキー   | tchaikovsky           | 1840-1893   |                     |
|  [/]   | 印象主義 (Impressionism)      | クロード・ドビュッシー                   | debussy               | 1862-1918   |                     |

## P1 (11-30)

| Status | Era                           | Name (JP)                        | Slug              | Birth-Death | 備考                             |
| :----: | :---------------------------- | :------------------------------- | :---------------- | :---------- | :------------------------------- |
|  [ ]   | バロック (Baroque)            | クラウディオ・モンテヴェルディ   | monteverdi        | 1567-1643   | Late Renaissance / Early Baroque |
|  [ ]   | バロック (Baroque)            | ゲオルク・フィリップ・テレマン   | telemann          | 1681-1767   |                                  |
|  [ ]   | バロック (Baroque)            | ゲオルク・フリードリヒ・ヘンデル | handel            | 1685-1759   |                                  |
|  [ ]   | 前期ロマン派 (Early Romantic) | ジョアキーノ・ロッシーニ         | rossini           | 1792-1868   |                                  |
|  [ ]   | 前期ロマン派 (Early Romantic) | エクトル・ベルリオーズ           | berlioz           | 1803-1869   |                                  |
|  [ ]   | 前期ロマン派 (Early Romantic) | フェリックス・メンデルスゾーン   | mendelssohn       | 1809-1847   | Famous Mendelssohn               |
|  [ ]   | 前期ロマン派 (Early Romantic) | ロベルト・シューマン             | schumann          | 1810-1856   | Famous Schumann                  |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | フランツ・リスト                 | liszt             | 1811-1886   |                                  |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | リヒャルト・ワーグナー           | wagner            | 1813-1883   |                                  |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | ジュゼッペ・ヴェルディ           | verdi             | 1813-1901   |                                  |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | アントン・ブルックナー           | bruckner          | 1824-1896   |                                  |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | ヨハン・シュトラウス2世          | johann-strauss-ii | 1825-1899   |                                  |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | カミーユ・サン＝サーンス         | saint-saens       | 1835-1921   |                                  |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | ジョルジュ・ビゼー               | bizet             | 1838-1875   |                                  |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | モデスト・ムソルグスキー         | mussorgsky        | 1839-1881   |                                  |
|  [ ]   | 後期ロマン派 (Late Romantic)  | アントニン・ドヴォルザーク       | dvorak            | 1841-1904   |                                  |
|  [ ]   | 後期ロマン派 (Late Romantic)  | エドヴァルド・グリーグ           | grieg             | 1843-1907   |                                  |
|  [ ]   | 後期ロマン派 (Late Romantic)  | ニコライ・リムスキー＝コルサコフ | rimsky-korsakov   | 1844-1908   |                                  |
|  [ ]   | 後期ロマン派 (Late Romantic)  | ジャコモ・プッチーニ             | puccini           | 1858-1924   |                                  |
|  [ ]   | 後期ロマン派 (Late Romantic)  | グスタフ・マーラー               | mahler            | 1860-1911   |                                  |

## P2 (31-60)

| Status | Era                           | Name (JP)                          | Slug               | Birth-Death | 備考                              |
| :----: | :---------------------------- | :--------------------------------- | :----------------- | :---------- | :-------------------------------- |
|  [ ]   | ルネサンス (Renaissance)      | ジョヴァンニ・ダ・パレストリーナ   | palestrina         | 1525-1594   |                                   |
|  [ ]   | ルネサンス (Renaissance)      | ウィリアム・バード                 | byrd               | 1543-1623   |                                   |
|  [ ]   | バロック (Baroque)            | アルカンジェロ・コレッリ           | corelli            | 1653-1713   |                                   |
|  [ ]   | バロック (Baroque)            | ヘンリー・パーセル                 | purcell            | 1659-1695   |                                   |
|  [ ]   | バロック (Baroque)            | ジャン＝フィリップ・ラモー         | rameau             | 1683-1764   |                                   |
|  [ ]   | バロック (Baroque)            | ドメニコ・スカルラッティ           | domenico-scarlatti | 1685-1757   |                                   |
|  [ ]   | 前期ロマン派 (Early Romantic) | ニコロ・パガニーニ                 | paganini           | 1782-1840   |                                   |
|  [ ]   | 前期ロマン派 (Early Romantic) | カール・マリア・フォン・ウェーバー | weber              | 1786-1826   |                                   |
|  [ ]   | 前期ロマン派 (Early Romantic) | ガエターノ・ドニゼッティ           | donizetti          | 1797-1848   |                                   |
|  [ ]   | 前期ロマン派 (Early Romantic) | ヴィンチェンツォ・ベッリーニ       | bellini            | 1801-1835   |                                   |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | ベドルジハ・スメタナ               | smetana            | 1824-1884   |                                   |
|  [ ]   | 後期ロマン派 (Late Romantic)  | ガブリエル・フォーレ               | faure              | 1845-1924   |                                   |
|  [ ]   | 後期ロマン派 (Late Romantic)  | エドワード・エルガー               | elgar              | 1857-1934   |                                   |
|  [ ]   | 後期ロマン派 (Late Romantic)  | リヒャルト\_シュトラウス           | richard-strauss    | 1864-1949   | Full name (avoid generic Strauss) |
|  [ ]   | 後期ロマン派 (Late Romantic)  | ジャン・シベリウス                 | sibelius           | 1865-1957   |                                   |
|  [ ]   | 後期ロマン派 (Late Romantic)  | セルゲイ・ラフマニノフ             | rachmaninoff       | 1873-1943   |                                   |
|  [ ]   | 後期ロマン派 (Late Romantic)  | グスターヴ・ホルスト               | holst              | 1874-1934   |                                   |
|  [ ]   | 印象主義 (Impressionism)      | エリック・サティ                   | satie              | 1866-1925   |                                   |
|  [ ]   | 印象主義 (Impressionism)      | モーリス・ラヴェル                 | ravel              | 1875-1937   |                                   |
|  [ ]   | 近代 (Modern)                 | アルノルト・シェーンベルク         | schoenberg         | 1874-1951   |                                   |
|  [ ]   | 近代 (Modern)                 | イーゴリ・ストラヴィンスキー       | stravinsky         | 1882-1971   |                                   |
|  [ ]   | 近代 (Modern)                 | セルゲイ・プロコフィエフ           | prokofiev          | 1891-1953   |                                   |
|  [ ]   | 近代 (Modern)                 | ジョージ・ガーシュウィン           | gershwin           | 1898-1937   |                                   |
|  [ ]   | 近代 (Modern)                 | アーロン・コープランド             | copland            | 1900-1990   |                                   |
|  [ ]   | 近代 (Modern)                 | ドミトリ・ショスタコーヴィチ       | shostakovich       | 1906-1975   |                                   |
|  [ ]   | 近代 (Modern)                 | ベンジャミン・ブリテン             | britten            | 1913-1976   |                                   |
|  [ ]   | 近代 (Modern)                 | レナード・バーンスタイン           | bernstein          | 1918-1990   |                                   |
|  [ ]   | 現代 (Contemporary)           | ジョン・ケージ                     | cage               | 1912-1992   |                                   |
|  [ ]   | 現代 (Contemporary)           | ジョン・ウィリアムズ               | john-williams      | 1932-       | Williams is common                |
|  [ ]   | 現代 (Contemporary)           | フィリップ・グラス                 | glass              | 1937-       |                                   |

## P3 (61-最後)

| Status | Era                           | Name (JP)                                  | Slug                      | Birth-Death | 備考                    |
| :----: | :---------------------------- | :----------------------------------------- | :------------------------ | :---------- | :---------------------- |
|  [ ]   | 中世 (Medieval)               | ヒルデガルト・フォン・ビンゲン             | hildegard-von-bingen      | 1098-1179   |                         |
|  [ ]   | 中世 (Medieval)               | ペロティヌス                               | perotin                   | 1160-1230   |                         |
|  [ ]   | 中世 (Medieval)               | ギヨーム・ド・マショー                     | machaut                   | 1300-1377   |                         |
|  [ ]   | 中世 (Medieval)               | フランチェスコ・ランディーニ               | landini                   | 1325-1397   |                         |
|  [ ]   | ルネサンス (Renaissance)      | ギヨーム・デュファイ                       | dufay                     | 1397-1474   |                         |
|  [ ]   | ルネサンス (Renaissance)      | ヨハネス・オケゲム                         | ockeghem                  | 1410-1497   |                         |
|  [ ]   | ルネサンス (Renaissance)      | ジョスカン・デ・プレ                       | josquin-des-prez          | 1450-1521   |                         |
|  [ ]   | ルネサンス (Renaissance)      | トマス・タリス                             | tallis                    | 1505-1585   |                         |
|  [ ]   | ルネサンス (Renaissance)      | オルランド・ディ・ラッソ                   | lasso                     | 1532-1594   |                         |
|  [ ]   | ルネサンス (Renaissance)      | トマス・ルイス・デ\_ビクトリア             | victoria                  | 1548-1611   |                         |
|  [ ]   | ルネサンス (Renaissance)      | ジョヴァンニ・ガブリエリ                   | gabrieli                  | 1557-1612   |                         |
|  [ ]   | ルネサンス (Renaissance)      | ジョン・ダウランド                         | dowland                   | 1563-1626   |                         |
|  [ ]   | ルネサンス (Renaissance)      | カルロ・ジェズアルド                       | gesualdo                  | 1566-1613   |                         |
|  [ ]   | バロック (Baroque)            | ハインリヒ・シュッツ                       | schutz                    | 1585-1672   |                         |
|  [ ]   | バロック (Baroque)            | ジャン＝バティスト・リュリ                 | lully                     | 1632-1687   |                         |
|  [ ]   | バロック (Baroque)            | ディートリヒ・ブクステフーデ               | buxtehude                 | 1637-1707   |                         |
|  [ ]   | バロック (Baroque)            | マルク＝アントワーヌ・シャルパンティエ     | charpentier               | 1643-1704   |                         |
|  [ ]   | バロック (Baroque)            | ヨハン・パッヘルベル                       | pachelbel                 | 1653-1706   |                         |
|  [ ]   | バロック (Baroque)            | アレッサンドロ・スカルラッティ             | alessandro-scarlatti      | 1660-1725   |                         |
|  [ ]   | バロック (Baroque)            | フランソワ・クープラン                     | couperin                  | 1668-1733   |                         |
|  [ ]   | バロック (Baroque)            | ジュゼッペ・タルティーニ                   | tartini                   | 1692-1770   |                         |
|  [ ]   | バロック (Baroque)            | ジャン＝マリー・ルクレール                 | leclair                   | 1697-1764   |                         |
|  [ ]   | バロック (Baroque)            | ジョヴァンニ・バッッティスタ・ペルゴレージ | pergolesi                 | 1710-1736   |                         |
|  [ ]   | 古典派 (Classical)            | クリストフ・ヴィリバルト・グルック         | gluck                     | 1714-1787   |                         |
|  [ ]   | 古典派 (Classical)            | カール・フィリップ・エマヌエル・バッハ     | carl-philipp-emanuel-bach | 1714-1788   | Full name (Bach family) |
|  [ ]   | 古典派 (Classical)            | ヨハン・クリスティアン・バッハ             | johann-christian-bach     | 1735-1782   | Full name (Bach family) |
|  [ ]   | 古典派 (Classical)            | ルイジ・ボッケリーニ                       | boccherini                | 1743-1805   |                         |
|  [ ]   | 古典派 (Classical)            | ドメニコ・チマローザ                       | cimarosa                  | 1749-1801   |                         |
|  [ ]   | 古典派 (Classical)            | アントニオ・サリエリ                       | salieri                   | 1750-1825   |                         |
|  [ ]   | 古典派 (Classical)            | ムツィオ・クレメンティ                     | clementi                  | 1752-1832   |                         |
|  [ ]   | 古典派 (Classical)            | ヨハン・ネポムク・フンメル                 | hummel                    | 1778-1837   |                         |
|  [ ]   | 古典派 (Classical)            | フェルナンド・ソル                         | sor                       | 1778-1839   |                         |
|  [ ]   | 古典派 (Classical)            | マウロ・ジュリアーニ                       | giuliani                  | 1781-1829   |                         |
|  [ ]   | 前期ロマン派 (Early Romantic) | ミハイル・グリンカ                         | glinka                    | 1804-1857   |                         |
|  [ ]   | 前期ロマン派 (Early Romantic) | ヨハン・シュトラウス1世                    | johann-strauss-i          | 1804-1849   |                         |
|  [ ]   | 前期ロマン派 (Early Romantic) | ファニー・メンデルスゾーン                 | fanny-mendelssohn         | 1805-1847   |                         |
|  [ ]   | 前期ロマン派 (Early Romantic) | クララ・シューマン                         | clara-schumann            | 1819-1896   |                         |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | シャルル・グノー                           | gounod                    | 1818-1893   |                         |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | ジャック・オッフェンバック                 | offenbach                 | 1819-1880   |                         |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | セザール・フランク                         | franck                    | 1822-1890   |                         |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | エドゥアール・ラロ                         | lalo                      | 1823-1892   |                         |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | アレクサンドル・ボロディン                 | borodin                   | 1833-1887   |                         |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | レオ・ドリーブ                             | delibes                   | 1836-1891   |                         |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | ミリイ・バラキレフ                         | balakirev                 | 1837-1910   |                         |
|  [ ]   | 中期ロマン派 (Mid Romantic)   | マックス・ブルッフ                         | bruch                     | 1838-1920   |                         |
|  [ ]   | 後期ロマン派 (Late Romantic)  | レオシュ・ヤナーチェク                     | janacek                   | 1854-1928   |                         |
|  [ ]   | 後期ロマン派 (Late Romantic)  | イサーク・アルベニス                       | albeniz                   | 1860-1909   |                         |
|  [ ]   | 後期ロマン派 (Late Romantic)  | カール・ニールセン                         | nielsen                   | 1865-1931   |                         |
|  [ ]   | 後期ロマン派 (Late Romantic)  | アレクサンドル・グラズノフ                 | glazunov                  | 1865-1936   |                         |
|  [ ]   | 後期ロマン派 (Late Romantic)  | エンリケ・グラナドス                       | granados                  | 1867-1916   |                         |
|  [ ]   | 後期ロマン派 (Late Romantic)  | フランツ・レハール                         | lehar                     | 1870-1948   |                         |
|  [ ]   | 後期ロマン派 (Late Romantic)  | アレクサンドル・スクリャービン             | scriabin                  | 1872-1915   |                         |
|  [ ]   | 後期ロマン派 (Late Romantic)  | レイフ・ヴォーン・ウィリアムズ             | vaughan-williams          | 1872-1958   |                         |
|  [ ]   | 印象主義 (Impressionism)      | フレデリック・ディーリアス                 | delius                    | 1862-1934   |                         |
|  [ ]   | 印象主義 (Impressionism)      | ポール・デュカス                           | dukas                     | 1865-1935   |                         |
|  [ ]   | 印象主義 (Impressionism)      | マヌエル・デ・ファリャ                     | falla                     | 1876-1946   |                         |
|  [ ]   | 印象主義 (Impressionism)      | オットリーノ・レスピーギ                   | respighi                  | 1879-1936   |                         |
|  [ ]   | 印象主義 (Impressionism)      | リリ・ブーランジェ                         | lili-boulanger            | 1893-1918   |                         |
|  [ ]   | 近代 (Modern)                 | チャールズ・アイヴズ                       | ives                      | 1874-1954   |                         |
|  [ ]   | 近代 (Modern)                 | ゾルターン・コダーイ                       | kodaly                    | 1882-1967   |                         |
|  [ ]   | 近代 (Modern)                 | アントン・ウェーベルン                     | webern                    | 1883-1945   |                         |
|  [ ]   | 近代 (Modern)                 | アルバン・ベルク                           | berg                      | 1885-1935   |                         |
|  [ ]   | 近代 (Modern)                 | エイトル・ヴィラ＝ロボス                   | villa-lobos               | 1887-1959   |                         |
|  [ ]   | 近代 (Modern)                 | パウル・ヒンデミット                       | hindemith                 | 1895-1963   |                         |
|  [ ]   | 近代 (Modern)                 | カール・オルフ                             | orff                      | 1895-1982   |                         |
|  [ ]   | 近代 (Modern)                 | フランシス・プーランク                     | poulenc                   | 1899-1963   |                         |
|  [ ]   | 近代 (Modern)                 | クルト・ヴァイル                           | weill                     | 1900-1950   |                         |
|  [ ]   | 近代 (Modern)                 | ホアキン・ロドリーゴ                       | rodrigo                   | 1901-1999   |                         |
|  [ ]   | 近代 (Modern)                 | アラム・ハチャトゥリアン                   | khachaturian              | 1903-1978   |                         |
|  [ ]   | 近代 (Modern)                 | ルロイ・アンダーソン                       | leroy-anderson            | 1908-1975   |                         |
|  [ ]   | 近代 (Modern)                 | オリヴィエ・メシアン                       | messiaen                  | 1908-1992   |                         |
|  [ ]   | 近代 (Modern)                 | サミュエル・バーバー                       | barber                    | 1910-1981   |                         |
|  [ ]   | 近代 (Modern)                 | アストル・ピアソラ                         | piazzolla                 | 1921-1992   |                         |
|  [ ]   | 現代 (Contemporary)           | ヤニス・クセナキス                         | xenakis                   | 1922-2001   |                         |
|  [ ]   | 現代 (Contemporary)           | ジェルジ・リゲティ                         | ligeti                    | 1923-2006   |                         |
|  [ ]   | 現代 (Contemporary)           | ピエール・ブーレーズ                       | boulez                    | 1925-2016   |                         |
|  [ ]   | 現代 (Contemporary)           | カールハインツ・シュトックハウゼン         | stockhausen               | 1928-2007   |                         |
|  [ ]   | 現代 (Contemporary)           | 武満 徹                                    | takemitsu                 | 1930-1996   |                         |
|  [ ]   | 現代 (Contemporary)           | アルヴォ・ペルト                           | part                      | 1935-       |                         |
|  [ ]   | 現代 (Contemporary)           | スティーヴ・ライヒ                         | reich                     | 1936-       |                         |
|  [ ]   | 現代 (Contemporary)           | ジョン・アダムズ                           | adams                     | 1947-       |                         |
|  [ ]   | 現代 (Contemporary)           | 久石 譲                                    | hisaishi                  | 1950-       |                         |
|  [ ]   | 現代 (Contemporary)           | 坂本 龍一                                  | sakamoto                  | 1952-2023   |                         |
