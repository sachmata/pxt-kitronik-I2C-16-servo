/**
 * Blocks for driving the Kitronik I2C 16-Servo Driver Board
 */
//% weight=100 color=#00A654 icon="\uf085" block="I2C 16-Servo"
namespace kitronik_i2c_16_servo {
  const CHIP_ADDRESS = 0x6a; // default Kitronik Chip address

  const ALL_LED_ON_L_REG = 0xfa;
  const ALL_LED_ON_H_REG = 0xfb;
  const ALL_LED_OFF_L_REG = 0xfc;
  const ALL_LED_OFF_H_REG = 0xfd;
  const PRE_SCALE_REG = 0xfe;

  const MODE1_REG = 0x00; // the mode 1 register address

  // To get the PWM pulses to the correct size and zero offset these are the default numbers.
  // 50 Hz - 133(0x85) - 27.24 MHz ?
  // datasheet says internal oscilator is 25 MHz
  const UPDATE_FREQ = 50; // 50 Hz
  const UPDATE_TIME = 1e6 / UPDATE_FREQ; // 200000 us
  const CHIP_CLOCK = 25e6; // 25 MHz
  const CHIP_COUNTER = 4096; // 2^12
  const PRE_SCALE = Math.floor(CHIP_CLOCK / (CHIP_COUNTER * UPDATE_FREQ) - 1); // 0x79

  const SERVO_ANGLE_RANGE = 180; // degrees
  const SERVO_PULSE_MIN = 700; // us
  const SERVO_PULSE_MAX = 2300; // us

  const UINT8LE = NumberFormat.UInt8LE;

  let initalised = false;

  const SERVO_REG_BASE = 0x08;
  const SERVO_REG_OFFSET = 4;

  // nice big list of servos for the block to use. These represent register offsets in the PCA9865
  export enum Servos {
    Servo1 = SERVO_REG_BASE + 0 * SERVO_REG_OFFSET,
    Servo2 = SERVO_REG_BASE + 1 * SERVO_REG_OFFSET,
    Servo3 = SERVO_REG_BASE + 2 * SERVO_REG_OFFSET,
    Servo4 = SERVO_REG_BASE + 3 * SERVO_REG_OFFSET,
    Servo5 = SERVO_REG_BASE + 4 * SERVO_REG_OFFSET,
    Servo6 = SERVO_REG_BASE + 5 * SERVO_REG_OFFSET,
    Servo7 = SERVO_REG_BASE + 6 * SERVO_REG_OFFSET,
    Servo8 = SERVO_REG_BASE + 7 * SERVO_REG_OFFSET,
    Servo9 = SERVO_REG_BASE + 8 * SERVO_REG_OFFSET,
    Servo10 = SERVO_REG_BASE + 9 * SERVO_REG_OFFSET,
    Servo11 = SERVO_REG_BASE + 10 * SERVO_REG_OFFSET,
    Servo12 = SERVO_REG_BASE + 11 * SERVO_REG_OFFSET,
    Servo13 = SERVO_REG_BASE + 12 * SERVO_REG_OFFSET,
    Servo14 = SERVO_REG_BASE + 13 * SERVO_REG_OFFSET,
    Servo15 = SERVO_REG_BASE + 14 * SERVO_REG_OFFSET,
    Servo16 = SERVO_REG_BASE + 15 * SERVO_REG_OFFSET
  }

  function servoAngleToOffCount(angle: number): [number, number] {
    const servoPulse = pins.map(
      angle,
      0,
      SERVO_ANGLE_RANGE,
      SERVO_PULSE_MIN,
      SERVO_PULSE_MAX
    );
    const offCount = pins.map(servoPulse, 0, UPDATE_TIME, 0, CHIP_COUNTER);

    return [offCount & 0x00ff, (offCount & 0xff00) >> 8];
  }

  function i2cWrite(register: number, value: number) {
    pins.i2cWriteNumber(CHIP_ADDRESS, register, UINT8LE, true);
    pins.i2cWriteNumber(CHIP_ADDRESS, value, UINT8LE, false);
  }

  function initalise(): void {
    // should probably do a soft reset of the I2C chip here when I figure out how

    // set the prescale to 50 hz
    i2cWrite(PRE_SCALE_REG, PRE_SCALE);

    // set all on to 0
    i2cWrite(ALL_LED_ON_L_REG, 0x00);
    i2cWrite(ALL_LED_ON_H_REG, 0x00);

    // set all off to equivalent of 90 deg
    const [centreLow, centreHigh] = servoAngleToOffCount(SERVO_ANGLE_RANGE / 2);
    i2cWrite(ALL_LED_OFF_L_REG, centreLow);
    i2cWrite(ALL_LED_OFF_H_REG, centreHigh);

    // set mode 1 register to come out of sleep
    i2cWrite(MODE1_REG, 0x01);

    //set the initalised flag so we dont come in here again automatically
    initalised = true;
  }

  /**
   * sets the requested servo to the reguested angle.
   * if the PCA has not yet been initialised calls the initialisation routine
   *
   * @param servo Which servo to set
   * @param angle the angle to set the servo to
   */
  //% blockId=kitronik_I2Cservo_write
  //% block="set%Servo|to%degrees"
  //% degrees.min=0 degrees.max=180
  export function servoWrite(servo: Servos, angle: number): void {
    if (!initalised) {
      initalise();
    }

    const [offLow, offHigh] = servoAngleToOffCount(angle);
    i2cWrite(servo, offLow);
    i2cWrite(servo + 1, offHigh);
  }
}
