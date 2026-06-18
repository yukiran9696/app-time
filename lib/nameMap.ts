// Normalize smart-quotes/curly-quotes to ASCII so map keys never need to care
function normalize(s: string): string {
  return s
    .replace(/[‘’]/g, "'") // ' ' → '
    .replace(/[“”]/g, '"'); // " " → "
}

// Build a normalized lookup at module load time
const _RAW_MAP: Record<string, string> = {
  // ── Tokyo Disneyland Attractions ─────────────────────────────────────────
  '"it\'s a small world with Groot"':          'イッツ・ア・スモールワールド with グルート',
  "Alice's Tea Party":                          'アリスのティーパーティー',
  "Beaver Brothers Explorer Canoes":            'ビーバーブラザーズのカヌー探検',
  "Big Thunder Mountain":                       'ビッグサンダー・マウンテン',
  "Castle Carrousel":                           'キャッスルカルーセル',
  "Chip 'n Dale's Treehouse":                  'チップとデールのツリーハウス',
  "Cinderella's Fairy Tale Hall":               'シンデレラのフェアリーテイル・ホール',
  "Country Bear Theater":                       'カントリーベア・シアター',
  "Donald's Boat":                              'ドナルドのボート',
  "Dumbo The Flying Elephant":                  'フライング・ダンボ',
  "Enchanted Tale of Beauty and the Beast":     '美女と野獣"魔法のものがたり"',
  "Gadget's Go Coaster":                        'ガジェットのゴーコースター',
  "Goofy's Paint 'n' Play House":              'グーフィーのペイント＆プレイハウス',
  "Haunted Mansion":                            'ホーンテッドマンション',
  "Jungle Cruise: Wildlife Expeditions":        'ジャングルクルーズ：ワイルドライフ・エクスペディション',
  "Mark Twain Riverboat":                       'マークトウェイン号',
  "Mickey's PhilharMagic":                      'ミッキーのフィルハーマジック',
  "Minnie's House":                             'ミニーのおうち',
  "Monsters, Inc. Ride & Go Seek!":             'モンスターズ・インク"ライド&ゴーシーク！"',
  "Omnibus":                                    'オムニバス',
  "Penny Arcade":                               'ペニーアーケード',
  "Peter Pan's Flight":                         'ピーターパン空の旅',
  "Pinocchio's Daring Journey":                 'ピノキオの冒険旅行',
  "Pirates of the Caribbean":                   'カリブの海賊',
  "Pooh's Hunny Hunt":                          'プーさんのハニーハント',
  "Roger Rabbit's Car Toon Spin":               'ロジャーラビットのカートゥーンスピン',
  "Snow White's Adventures":                    '白雪姫と七人のこびと',
  "Splash Mountain":                            'スプラッシュ・マウンテン',
  "Star Tours: The Adventures Continue":        'スター・ツアーズ：ザ・アドベンチャーズ・コンティニュー',
  "Stitch Encounter":                           'スティッチ・エンカウンター',
  "Swiss Family Treehouse":                     'スイスファミリー・ツリーハウス',
  'The Enchanted Tiki Room: Stitch Presents "Aloha E Komo Mai!"':
                                                '魅惑のチキルーム：スティッチ・プレゼンツ"アロハ・エ・コモ・マイ！"',
  "The Happy Ride with Baymax":                 'ベイマックスのハッピーライド',
  "Tom Sawyer Island Rafts":                    'トム・ソーヤー島いかだ',
  "Toon Park":                                  'トゥーンパーク',
  "Western River Railroad":                     'ウエスタンリバー鉄道',
  "Westernland Shootin' Gallery":               'ウエスタンランド・シューティングギャラリー',

  // ── Tokyo DisneySea Attractions ──────────────────────────────────────────
  "20,000 Leagues Under the Sea":               '海底2万マイル',
  "Anna and Elsa's Frozen Journey":             'アナとエルサのフローズンジャーニー',
  "Aquatopia":                                  'アクアトピア',
  "Ariel's Playground":                         'アリエルのプレイグラウンド',
  "Big City Vehicles":                          'ビッグシティ・ヴィークルズ',
  "Blowfish Balloon Race":                      'ブローフィッシュ・バルーン・レース',
  "Caravan Carousel":                           'キャラバンカルーセル',
  "DisneySea Electric Railway (American Waterfront)":
                                                'ディズニーシー・エレクトリックレールウェイ（アメリカンウォーターフロント）',
  "DisneySea Electric Railway (Port Discovery)":
                                                'ディズニーシー・エレクトリックレールウェイ（ポートディスカバリー）',
  "DisneySea Transit Steamer Line (American Waterfront)":
                                                'ディズニーシー・トランジットスチーマーライン（アメリカンウォーターフロント）',
  "DisneySea Transit Steamer Line (Lost River Delta)":
                                                'ディズニーシー・トランジットスチーマーライン（ロストリバーデルタ）',
  "DisneySea Transit Steamer Line (Mediterranean Harbor)":
                                                'ディズニーシー・トランジットスチーマーライン（メディテレーニアンハーバー）',
  "Fairy Tinker Bell's Busy Buggies":           'フェアリー・ティンカーベルのビジーバギー',
  "Flounder's Flying Fish Coaster":             'フランダーのフライングフィッシュコースター',
  "Fortress Explorations":                      'フォートレス・エクスプロレーション',
  "Indiana Jones Adventure®: Temple of the Crystal Skull":
                                                'インディ・ジョーンズ・アドベンチャー：クリスタルスカルの魔宮',
  "Jasmine's Flying Carpets":                   'ジャスミンのフライングカーペット',
  "Journey to the Center of the Earth":         '地球の中心への旅',
  "Jumpin' Jellyfish":                          'ジャンピン・ジェリーフィッシュ',
  "Mermaid Lagoon Theater":                     'マーメイドラグーンシアター',
  "Nemo & Friends SeaRider":                    'ニモ＆フレンズ・シーライダー',
  "Peter Pan's Never Land Adventure":           'ピーターパンのネバーランドアドベンチャー',
  "Raging Spirits":                             'レイジングスピリッツ',
  "Rapunzel's Lantern Festival":                'ラプンツェルのランタンフェスティバル',
  "Scuttle's Scooters":                         'スカットルのスクーターズ',
  "Sindbad's Storybook Voyage":                 'シンドバッド・ストーリーブック・ヴォヤッジ',
  "Soaring: Fantastic Flight":                  'ソアリン：ファンタスティック・フライト',
  "The Leonardo Challenge":                     'レオナルド・チャレンジ',
  "The Magic Lamp Theater":                     'マジックランプシアター',
  "The Whirlpool":                              'ザ・ワールプール',
  "Tower of Terror":                            'タワー・オブ・テラー',
  "Toy Story Mania!":                           'トイ・ストーリー・マニア！',
  "Turtle Talk":                                'タートル・トーク',
  "Venetian Gondolas":                          'ヴェネツィアン・ゴンドラ',

  // ── TDL Shows ────────────────────────────────────────────────────────────
  "Disney Harmony in Color":                    'ディズニー・ハーモニー・イン・カラー',
  "It's a Sweetsful Time!":                     'スウィーツタイム！',
  "Jamboree Mickey! Let's Dance!(Dance Program for Kids)":
                                                'ジャンボリミッキー！レッツ・ダンス！',
  "Mickey's Magical Music World":               'ミッキーのマジカルミュージックワールド',
  "Mickey's Rainbow Luau":                      'ミッキーのレインボー・ルアウ',
  "Reach for the Stars":                        'リーチ・フォー・ザ・スターズ',
  "Sky Full of Colors  (Tokyo Disneyland)":     'スカイ・フル・オブ・カラーズ（東京ディズニーランド）',
  "The Diamond Variety Muster":                 'ダイヤモンド・バラエティ・マスター',
  "Tokyo Disneyland Electrical Parade Dreamlights":
                                                '東京ディズニーランド・エレクトリカルパレード・ドリームライツ',

  // ── TDS Shows ────────────────────────────────────────────────────────────
  "Believe! Sea of Dreams":                     'ビリーヴ！〜シー・オブ・ドリームス〜',
  "Dance the Globe!":                           'ダンス・ザ・グローブ！',
  "Dreams Take Flight":                         'ドリームス・テイク・フライト',
  "Duffy and Friends' Wonderful Friendship":    'ダッフィー&フレンズのワンダフル・フレンドシップ',
  "Sky Full of Colors (Tokyo DisneySea)":       'スカイ・フル・オブ・カラーズ（東京ディズニーシー）',
  "Sparkling Jubilee Celebration":              'スパークリング・ジュビリー・セレブレーション',
  "Special Image Projection: Sparkling Jubilee Night":
                                                'スペシャルイメージプロジェクション：スパークリング・ジュビリーナイト',
  "The Groovy Jammin' Chefs":                  'グルービー・ジャミン・シェフス',
};

// Pre-normalize all keys once at startup
const NAME_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(_RAW_MAP).map(([k, v]) => [normalize(k), v])
);

export function toJapaneseName(name: string): string {
  return NAME_MAP[normalize(name)] ?? name;
}
