
import { GameService } from '../services/GameService';
import { BOARD_CONFIG, PieceType, PlayerColor } from '@rps/shared';

const gameService = new GameService();

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
}

async function verifyRPSLSLogic() {
    console.log('🧪 Starting RPSLS Verification...');

    // 1. Verify Board Configuration
    console.log('\n--- Verifying Board Configuration ---');
    const rpslsConfig = BOARD_CONFIG.rpsls;
    assert(rpslsConfig.rows === 6, 'RPSLS rows should be 6');
    assert(rpslsConfig.cols === 6, 'RPSLS cols should be 6');
    assert(rpslsConfig.pieces.lizard === 2, 'RPSLS should have 2 lizards');
    assert(rpslsConfig.pieces.spock === 2, 'RPSLS should have 2 spocks');

    const classicConfig = BOARD_CONFIG.classic;
    assert(classicConfig.rows === 6, 'Classic rows should be 6');
    assert(classicConfig.cols === 7, 'Classic cols should be 7');
    assert(classicConfig.pieces.lizard === 0, 'Classic should have 0 lizards');

    // 2. Verify Session Creation & Mode Separation
    console.log('\n--- Verifying Session Creation & Mode Separation ---');
    const rpslsSession = gameService.createSession('session_rpsls', 'p1', 'red', 'p2', 'blue', 'rpsls');
    assert(rpslsSession.gameMode === 'rpsls', 'Session should be in rpsls mode');
    assert(rpslsSession.board.length === 6, 'RPSLS board should have 6 rows');
    assert(rpslsSession.board[0].length === 6, 'RPSLS board should have 6 cols');

    const classicSession = gameService.createSession('session_classic', 'p3', 'red', 'p4', 'blue', 'classic');
    assert(classicSession.gameMode === 'classic', 'Session should be in classic mode');
    assert(classicSession.board.length === 6, 'Classic board should have 6 rows');
    assert(classicSession.board[0].length === 7, 'Classic board should have 7 cols');

    // 3. Verify Combat Logic via GameService (Integration)
    // We will place pieces adjacent to each other and force a move
    console.log('\n--- Verifying Combat Logic (GameService Integration) ---');

    // Setup a clean playing state for combat testing
    rpslsSession.phase = 'playing';
    rpslsSession.currentTurn = 'red';

    // Helper to test combat: Attacker (Red) moves to Defender (Blue)
    function testCombat(attackerType: PieceType, defenderType: PieceType, expectedWinner: 'attacker' | 'defender' | 'tie') {
        // Reset turn to Red for each test
        rpslsSession.currentTurn = 'red';

        const from = { row: 3, col: 0 };
        const to = { row: 3, col: 1 };


        // Clear board spots
        rpslsSession.board[from.row][from.col].piece = null;
        rpslsSession.board[to.row][to.col].piece = null;

        // Setup Attacker (Red)
        const attacker = {
            id: `atk_${attackerType}`,
            owner: 'red' as PlayerColor,
            type: attackerType,
            position: from,
            isRevealed: false,
            hasHalo: false
        };
        rpslsSession.players.red!.pieces = [attacker]; // Reset pieces
        rpslsSession.board[from.row][from.col].piece = attacker;

        // Setup Defender (Blue)
        const defender = {
            id: `def_${defenderType}`,
            owner: 'blue' as PlayerColor,
            type: defenderType,
            position: to,
            isRevealed: false,
            hasHalo: false
        };
        rpslsSession.players.blue!.pieces = [defender]; // Reset pieces
        rpslsSession.board[to.row][to.col].piece = defender;

        // Execute Move
        const result = gameService.makeMove('p1', from, to); // p1 is red

        if (expectedWinner === 'tie') {
            assert(result.success && result.combat === true, `${attackerType} vs ${defenderType} should be combat`);
            assert(rpslsSession.phase === 'tie_breaker', `${attackerType} vs ${defenderType} should result in tie phase`);
            // Reset phase for next test
            rpslsSession.phase = 'playing';
            rpslsSession.combatState = null;
        } else {
            assert(result.success && result.combat === true, `${attackerType} vs ${defenderType} should be combat`);
            const remainingPiece = rpslsSession.board[to.row][to.col].piece;
            if (expectedWinner === 'attacker') {
                assert(remainingPiece?.owner === 'red', `${attackerType} (Red) should beat ${defenderType} (Blue)`);
            } else {
                assert(remainingPiece?.owner === 'blue', `${defenderType} (Blue) should beat ${attackerType} (Red)`);
            }
        }
    }

    // Test Cases based on RPSLS rules
    // Scissors cuts Paper
    testCombat('scissors', 'paper', 'attacker');
    // Paper covers Rock
    testCombat('paper', 'rock', 'attacker');
    // Rock crushes Lizard
    testCombat('rock', 'lizard', 'attacker');
    // Lizard poisons Spock
    testCombat('lizard', 'spock', 'attacker');
    // Spock smashes Scissors
    testCombat('spock', 'scissors', 'attacker');
    // Scissors decapitates Lizard
    testCombat('scissors', 'lizard', 'attacker');
    // Lizard eats Paper
    testCombat('lizard', 'paper', 'attacker');
    // Paper disproves Spock
    testCombat('paper', 'spock', 'attacker');
    // Spock vaporizes Rock
    testCombat('spock', 'rock', 'attacker');
    // Rock crushes Scissors
    testCombat('rock', 'scissors', 'attacker');

    // Test Defeats (Inverse)
    testCombat('paper', 'scissors', 'defender');
    testCombat('rock', 'paper', 'defender');

    // Test Ties
    testCombat('lizard', 'lizard', 'tie');
    testCombat('spock', 'spock', 'tie');

    console.log('\n🎉 All verifications passed successfully!');
}

verifyRPSLSLogic().catch(console.error);
