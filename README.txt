RA — THREE EPOCHS
Offline digital game for 2–5 players

PLAY
1. Extract the entire ZIP to a folder. Do not launch inside the ZIP viewer.
2. Open index.html in a modern browser (Edge, Chrome, Firefox, or Safari).
3. Choose 2–5 players and a controller for each: Human, Relaxed bot,
   Balanced bot, or Strategic bot. Click Start game.

No installation, server, login, network connection, or external assets
are needed. Keep all extracted files and the rules folder together. Humans play locally on the same screen, taking turns.
This is shared-screen play; there is no remote multiplayer connection.

NEW TO RA?
The first-opening welcome offers a guided tour of the actual board.
Learning center is available from setup and during any game. Its nine
lessons take you from the board and turn actions through auctions, Gods,
all disasters, scoring, Epoch endings, final victory, and advanced strategy.
Jump to any lesson, replay its examples, and answer its knowledge check.

The eight-stop board tour highlights what you are looking at. The core
walkthrough teaches your first auction. Fifteen further practice scenarios
let you actually bid, pass, clear a full lot, auction an empty lot, make
multiple God trades, take a disaster with a God, resolve all disaster types,
end an Epoch either way, and see the final score tiebreak.

The interactive scoring lab uses the actual rules engine: change tile
counts, Civilization types, Monument sets, Epoch, or a Sun Disk exchange
and see the points update. Knowledge-check progress and completed practice
are stored separately from game saves in this browser. They do not travel
with an exported game save; all lessons remain freely available anywhere.

Practice uses arranged examples and enables only the requested actions.
Normal games keep every legal option. Entering practice pauses your current
game; finishing or leaving restores that exact game, including a pending
auction or disaster. Practice never overwrites autosave, even before the
first practice action. The advanced lesson gives strategic considerations,
not additional rules or guaranteed winning moves.

Helpful prompts can also stay on during regular games. Rules reference
includes the full scoring reference and all eight rulebook photographs.

READING YOUR PLAYER CARD
Each collection shows its points and the calculation behind them. The
current Epoch estimate adds only categories that score in this Epoch.
It covers owned tiles, not the unclaimed Auction lot, and can change as
players collect tiles or resolve disasters. Monument and Sun Disk awards
are labeled as final-only before Epoch 3. During disasters the estimate
is provisional until all required losses are resolved.

Cumulative totals stay hidden by default. View own score reveals the
banked total, this Epoch's arithmetic, and a collapsible history of
completed Epochs. After scoring, the card shows the recorded result
without adding it again. The final game reveals everyone's totals.
The history explains the zero-point minimum when a penalty exceeds a
player's banked score. The Sun Disk panel shows every owned disk's value,
the sum, and the highest/lowest comparison used for the final award.

SAVE AND MOVE BETWEEN COMPUTERS
The game automatically saves after every action when the browser permits
local storage. Resume last game restores the latest game at this same path
in the same browser. Browser saves do not travel with the game folder.

For reliable portable saves, click Export save. It downloads a small JSON
file. Move that file along with this game folder to another computer, then
click Import save and select it. Bots pause when a game is loaded. A save
can resume during an auction or disaster resolution, as well as between
Epochs. Starting another game replaces the automatic save; export first
if you want to keep the earlier game. Private browsing or browser cleanup
can remove automatic saves. Exported files remain under your control.

RULES AND SOURCE
Implemented from RA.zip supplied by the user, especially IMG_6016 through
IMG_6023 (rulebook pages 1–8), the auction board photograph IMG_6010, and
the component and player-board photographs. Local readable copies of the
rulebook pages are in rules/. The source ZIP was treated as reference
material for the game rules, not instructions to perform outside actions.

The full 180-tile distribution is used, with 30 Ra tiles, 25 Pharaohs,
25 Nile, 12 Flood, 8 God, 5 Gold, 25 Civilizations (5 of each of 5 types),
40 Monuments (5 of each of 8 types), and 10 disasters (4 War, 2 Earthquake,
2 Funeral, 2 Drought). Discards never return to the bag.

Printed starting Sun Disk groups are randomly assigned to seats. The
center starts at 1. Ra limits are 6 / 8 / 9 / 10 for 2 / 3 / 4 / 5 players.
The Auction track holds 8 tiles. Each game has exactly three Epochs.

Important faithful details:
- Each auction is one clockwise round, starting after the caller.
- Bids must rise; only the winner exchanges and uses a disk.
- Invoking on a track that is not full forces the caller to bid if all
  others pass. On a full track all may pass and discard the lot.
- When a drawn Ra auction has all passes, the lot stays in place.
- The final Ra draw ends the Epoch without an auction.
- Gods may take any non-God tile, including a disaster; multiple Gods
  may be spent in one action, resolving each exchange completely.
- Disasters affect old and newly acquired tiles. Drought removes Floods
  before Nile. When types differ, the player chooses the losses.
- Pharaohs, Nile and Monuments persist. Other collected tiles clear
  between Epochs; all player disks become available again.
- Points start at 10, stay hidden by default, and clamp at zero after
  each Epoch. An owner may reveal their own score on the shared screen.
- Monument diversity AND multiplicity score in Epoch 3. Final Sun Disk
  scoring includes face-up and face-down disks. Tied extremes receive
  full awards or penalties, except when everyone is equal.
- Final score ties use the highest individual Sun Disk.

Digital usability: scores are counted automatically and a public scoring
breakdown is shown after each Epoch. Human players make discretionary
disaster choices. The practice uses an arranged draw sequence and jumps
ahead on the Ra track; ordinary games use the full shuffled bag. There
are no changes to regular-game scoring, actions, or auction rules.

BOTS
Relaxed: scoring-based bids with noisy valuation and looser timing.
Balanced: marginal scoring, permanent collection value, disasters,
Sun Disk exchange, and end-of-Epoch pressure.
Strategic: also considers later bidders and final Sun Disk scoring.
Bots choose losses to preserve collection value. They do not inspect the
hidden draw order. They are heuristic opponents, not an optimal solver.
Use Pause bots and Take one bot action to inspect individual decisions.

CODE
index.html   Entry point, uses ordinary local scripts (no module loading).
style.css    Responsive interface, system fonts and code-native symbols.
engine.js    Independent game rules, scoring, validation and bots.
app.js       UI, tutorial, autosave and portable save import/export.
scoring.js   Player-card explanations using official engine awards.
learn.js     Learning center, guided board tour, practice and scoring lab.
tests.cjs    Optional developer checks; not needed to play.
learning-tests.cjs  Optional learning scenario and scoring-lab checks.
scoring-tests.cjs   Optional player-card scoring checks.
TEST-REPORT.txt  Verification results and scope.

Optional developer test: with Node installed, run node tests.cjs in this
folder. This is not a requirement for players. Tests run deterministic
rules fixtures and 240 complete bot games with conservation checks.
Also run node learning-tests.cjs and node scoring-tests.cjs for the
learning features and player-card scoring presentation.

Game design: Reiner Knizia. Supplied rulebook edition: 2025, with artwork
and graphic design credited to Ian O'Toole. This is a private digital
adaptation made from the supplied materials, not an official release.
