const CRC_TABLE = [0, 4129, 8258, 12387, 16516, 20645, 24774, 28903, 33032, 37161, 41290, 45419, 49548, 53677, 57806, 61935, 4657, 528, 12915, 8786, 21173, 17044, 29431, 25302, 37689, 33560, 45947, 41818, 54205, 50076, 62463, 58334, 9314, 13379, 1056, 5121, 25830, 29895, 17572, 21637, 42346, 46411, 34088, 38153, 58862, 62927, 50604, 54669, 13907, 9842, 5649, 1584, 30423, 26358, 22165, 18100, 46939, 42874, 38681, 34616, 63455, 59390, 55197, 51132, 18628, 22757, 26758, 30887, 2112, 6241, 10242, 14371, 51660, 55789, 59790, 63919, 35144, 39273, 43274, 47403, 23285, 19156, 31415, 27286, 6769, 2640, 14899, 10770, 56317, 52188, 64447, 60318, 39801, 35672, 47931, 43802, 27814, 31879, 19684, 23749, 11298, 15363, 3168, 7233, 60846, 64911, 52716, 56781, 44330, 48395, 36200, 40265, 32407, 28342, 24277, 20212, 15891, 11826, 7761, 3696, 65439, 61374, 57309, 53244, 48923, 44858, 40793, 36728, 37256, 33193, 45514, 41451, 53516, 49453, 61774, 57711, 4224, 161, 12482, 8419, 20484, 16421, 28742, 24679, 33721, 37784, 41979, 46042, 49981, 54044, 58239, 62302, 689, 4752, 8947, 13010, 16949, 21012, 25207, 29270, 46570, 42443, 38312, 34185, 62830, 58703, 54572, 50445, 13538, 9411, 5280, 1153, 29798, 25671, 21540, 17413, 42971, 47098, 34713, 38840, 59231, 63358, 50973, 55100, 9939, 14066, 1681, 5808, 26199, 30326, 17941, 22068, 55628, 51565, 63758, 59695, 39368, 35305, 47498, 43435, 22596, 18533, 30726, 26663, 6336, 2273, 14466, 10403, 52093, 56156, 60223, 64286, 35833, 39896, 43963, 48026, 19061, 23124, 27191, 31254, 2801, 6864, 10931, 14994, 64814, 60687, 56684, 52557, 48554, 44427, 40424, 36297, 31782, 27655, 23652, 19525, 15522, 11395, 7392, 3265, 61215, 65342, 53085, 57212, 44955, 49082, 36825, 40952, 28183, 32310, 20053, 24180, 11923, 16050, 3793, 7920];
const SyncWord = 43605;
const BLE_LINGO_BLE_LINGO_MUDULE_SETTINGS = 0;
const BLE_LINGO_BLE_LINGO_GENERAL = 1;
const BLE_LINGO_BLE_LINGO_REMOTE = 2;
const BLE_LINGO_BLE_LINGO_SYSTEM_SETTINGS = 3;
const BLE_LINGO_BLE_LINGO_WORKOUT_TRACKING = 128;

const BLE_LINGO_GENERAL_COMMANDS_BLE_GET_MACHINE_INFO = 2;
const BLE_LINGO_GENERAL_COMMANDS_BLE_SET_USER_DATA = 15;
const BLE_LINGO_GENERAL_COMMANDS_BLE_GET_USER_DATA = 16;
const BLE_LINGO_GENERAL_COMMANDS_BLE_GET_WORKOUT_DATA = 18;
const BLE_LINGO_GENERAL_COMMANDS_BLE_STOP_WORKOUT = 20;

const BLE_LINGO_REMOTE_COMMANDS_BLE_START_WORKOUT=2;
const BLE_LINGO_REMOTE_COMMANDS_BLE_SET_SPEED=5;
const BLE_LINGO_REMOTE_COMMANDS_BLE_SET_INCLINE=6;

class Treadmill {

    static transactionId = 0;
    

    static startWorkOut(programType, workoutTime, warmUpTime, cooldownTime, units, speedX10, inclineX10, resistance) {
        console.log('--------------------startWorkout-----------------');
        let datas = Treadmill.byteToBigByte(
            14,
            Treadmill.int2byte(programType.getInt(), 2),
            Treadmill.int2byte(workoutTime, 2),
            Treadmill.int2byte(warmUpTime, 2),
            Treadmill.int2byte(cooldownTime, 2),
            Treadmill.int2byte(units.getInt(), 1),
            Treadmill.int2byte(speedX10, 2),
            Treadmill.int2byte(inclineX10, 2),
            Treadmill.int2byte(resistance, 1)
        );

        let confirm = Treadmill.GenerateCRC_CCITT(datas, 14);
        let i = Treadmill.transactionId + 1;
        Treadmill.transactionId = i;
        let bytes = Treadmill.byteToBigByte(
            24,
            Treadmill.int2byte(SyncWord, 2),
            Treadmill.int2byte(i, 2),
            Treadmill.int2byte(BLE_LINGO_BLE_LINGO_REMOTE, 1),
            Treadmill.int2byte(BLE_LINGO_REMOTE_COMMANDS_BLE_START_WORKOUT, 1),
            Treadmill.int2byte(14, 2),
            Treadmill.int2byte(confirm, 2),
            datas
        );

        return bytes;
    }

    static stopWorkoutCompletion() {
        console.log('--------------------stopWorkoutCompletion-----------------');
        let confirm = Treadmill.GenerateCRC_CCITT(null, 0);
        let i = Treadmill.transactionId + 1;
        Treadmill.transactionId = i;
        let bytes = Treadmill.byteToBigByte(
            10,
            Treadmill.int2byte(SyncWord, 2),
            Treadmill.int2byte(i, 2),
            Treadmill.int2byte(BLE_LINGO_BLE_LINGO_GENERAL, 1),
            Treadmill.int2byte(BLE_LINGO_GENERAL_COMMANDS_BLE_STOP_WORKOUT, 1),
            Treadmill.int2byte(0, 2),
            Treadmill.int2byte(confirm, 2)
        );

        return bytes;
    }

    static setSpeed(units, speedX10) {
        console.log('--------------------setSpeed-----------------');
        let datas = Treadmill.byteToBigByte(
            3,
            Treadmill.int2byte(speedX10, 2),
            Treadmill.int2byte(units, 1)
        );

        let confirm = Treadmill.GenerateCRC_CCITT(datas, 3);
        let i = Treadmill.transactionId + 1;
        Treadmill.transactionId = i;
        let bytes = Treadmill.byteToBigByte(
            13,
            Treadmill.int2byte(SyncWord, 2),
            Treadmill.int2byte(i, 2),
            Treadmill.int2byte(BLE_LINGO_BLE_LINGO_REMOTE.getInt(), 1),
            Treadmill.int2byte(BLE_LINGO_REMOTE_COMMANDS_BLE_SET_SPEED.getInt(), 1),
            Treadmill.int2byte(3, 2),
            Treadmill.int2byte(confirm, 2),
            datas
        );

        return bytes;
    }

    static setIncline(incline) {
        console.log('--------------------setIncline-----------------');
        let datas = Treadmill.byteToBigByte(
            2,
            Treadmill.int2byte(incline * 10, 2)
        );

        let confirm = Treadmill.GenerateCRC_CCITT(datas, 2);
        let i = Treadmill.transactionId + 1;
        Treadmill.transactionId = i;
        let bytes = Treadmill.byteToBigByte(
            12,
            Treadmill.int2byte(SyncWord, 2),
            Treadmill.int2byte(i, 2),
            Treadmill.int2byte(BLE_LINGO_BLE_LINGO_REMOTE.getInt(), 1),
            Treadmill.int2byte(BLE_LINGO_REMOTE_COMMANDS_BLE_SET_INCLINE.getInt(), 1),
            Treadmill.int2byte(2, 2),
            Treadmill.int2byte(confirm, 2),
            datas
        );

        return bytes;
    }

    static byteToBigByte(length, ...b) {
        let values = new Uint8Array(length);
        let index = 0;
        for (let i = 0; i < b.length; i++) {
            for (let j = 0; j < b[i].length; j++) {
                values[index] = b[i][j];
                index++;
            }
        }
        return values;
    }

    static int2byte(res, index) {
        let targets = new Uint8Array(index);
        targets[0] = res & 255;
        if (index === 2) {
            targets[1] = (res >> 8) & 255;
        }
        return targets;
    }

    static GenerateCRC_CCITT(PUPtr8, PU16_Count) {
        if (PU16_Count === 0) {
            return 0;
        }
        let crc = 65535;
        for (let i = 0; i < PU16_Count; i++) {
            let crc3 = PUPtr8[i];
            let crc2 = CRC_TABLE[((crc & 0xFF00) >> 8) ^ (crc3 & 0xFF)];
            crc = ((crc << 8) & 0xFFFF) ^ crc2;
        }
        return crc;
    }
}

export default Treadmill;
