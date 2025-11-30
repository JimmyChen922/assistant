
import { ChartDefinition } from './types.ts';

export const HEADER_MAPPINGS: Record<string, string[]> = {
    // Power
    'blackbox.motor[0]': ['blackbox.motor[0]', 'motor_1', 'motor1', 'Motor1', 'MOTOR1', 'Motor 1'],
    'blackbox.motor[1]': ['blackbox.motor[1]', 'motor_2', 'motor2', 'Motor2', 'MOTOR2', 'Motor 2'],
    'blackbox.motor[2]': ['blackbox.motor[2]', 'motor_3', 'motor3', 'Motor3', 'MOTOR3', 'Motor 3'],
    'blackbox.motor[3]': ['blackbox.motor[3]', 'motor_4', 'motor4', 'Motor4', 'MOTOR4', 'Motor 4'],
    'blackbox.esc_info.esc[0].current': ['blackbox.esc_info.esc[0].current', 'esc1_current', 'esc1_curr', 'ESC1_CURRENT', 'ESC1_CURR', 'esc1 current'],
    'blackbox.esc_info.esc[1].current': ['blackbox.esc_info.esc[1].current', 'esc2_current', 'esc2_curr', 'ESC2_CURRENT', 'ESC2_CURR', 'esc2 current'],
    'blackbox.esc_info.esc[2].current': ['blackbox.esc_info.esc[2].current', 'esc3_current', 'esc3_curr', 'ESC3_CURRENT', 'ESC3_CURR', 'esc3 current'],
    'blackbox.esc_info.esc[3].current': ['blackbox.esc_info.esc[3].current', 'esc4_current', 'esc4_curr', 'ESC4_CURRENT', 'ESC4_CURR', 'esc4 current'],
    'blackbox.esc_info.esc[0].step_time': ['blackbox.esc_info.esc[0].step_time', 'esc1_step_time', 'esc1_time', 'ESC1_STEP_TIME', 'ESC1_TIME', 'esc1 step time'],
    'blackbox.esc_info.esc[1].step_time': ['blackbox.esc_info.esc[1].step_time', 'esc2_step_time', 'esc2_time', 'ESC2_STEP_TIME', 'ESC2_TIME', 'esc2 step time'],
    'blackbox.esc_info.esc[2].step_time': ['blackbox.esc_info.esc[2].step_time', 'esc3_step_time', 'esc3_time', 'ESC3_STEP_TIME', 'ESC3_TIME', 'esc3 step time'],
    'blackbox.esc_info.esc[3].step_time': ['blackbox.esc_info.esc[3].step_time', 'esc4_step_time', 'esc4_time', 'ESC4_STEP_TIME', 'ESC4_TIME', 'esc4 step time'],
    'blackbox.esc_info.esc[0].voltage': ['blackbox.esc_info.esc[0].voltage', 'esc1_voltage', 'esc1_volt', 'ESC1_VOLTAGE', 'ESC1_VOLT', 'esc1 voltage'],
    'blackbox.esc_info.esc[1].voltage': ['blackbox.esc_info.esc[1].voltage', 'esc2_voltage', 'esc2_volt', 'ESC2_VOLTAGE', 'ESC2_VOLT', 'esc2 voltage'],
    'blackbox.esc_info.esc[2].voltage': ['blackbox.esc_info.esc[2].voltage', 'esc3_voltage', 'esc3_volt', 'ESC3_VOLTAGE', 'ESC3_VOLT', 'esc3 voltage'],
    'blackbox.esc_info.esc[3].voltage': ['blackbox.esc_info.esc[3].voltage', 'esc4_voltage', 'esc4_volt', 'ESC4_VOLTAGE', 'ESC4_VOLT', 'esc4 voltage'],
    'blackbox.esc_info.esc[0].temperature': ['blackbox.esc_info.esc[0].temperature', 'esc1_temperature', 'esc1_temp', 'ESC1_TEMPERATURE', 'ESC1_TEMP', 'esc1 temperature'],
    'blackbox.esc_info.esc[1].temperature': ['blackbox.esc_info.esc[1].temperature', 'esc2_temperature', 'esc2_temp', 'ESC2_TEMPERATURE', 'ESC2_TEMP', 'esc2 temperature'],
    'blackbox.esc_info.esc[2].temperature': ['blackbox.esc_info.esc[2].temperature', 'esc3_temperature', 'esc3_temp', 'ESC3_TEMPERATURE', 'ESC3_TEMP', 'esc3 temperature'],
    'blackbox.esc_info.esc[3].temperature': ['blackbox.esc_info.esc[3].temperature', 'esc4_temperature', 'esc4_temp', 'ESC4_TEMPERATURE', 'ESC4_TEMP', 'esc4 temperature'],

    // Flight Control
    'blackbox.attitude.roll': ['blackbox.attitude.roll', 'roll', 'att_x', 'Roll', 'ATT_X'],
    'blackbox.attitude.pitch': ['blackbox.attitude.pitch', 'pitch', 'att_y', 'Pitch', 'ATT_Y'],
    'blackbox.attitude.yaw': ['blackbox.attitude.yaw', 'yaw', 'att_z', 'Yaw', 'ATT_Z'],
    'blackbox.fs_act': ['blackbox.fs_act', 'fs_act', 'FS', 'FS_ACT', 'Failsafe', 'failsafe'],
    'blackbox.error': ['blackbox.error', 'error', 'ERR', 'Error', 'ERROR'],
    'blackbox.rat_ctrl_cmd_.z': ['blackbox.rat_ctrl_cmd_.z', 'rat_ctrl_cmd_z', 'rat_ctrl_z', 'RateControlCmdZ'],
    'blackbox.sensor_values.gyro_x': ['blackbox.sensor_values.gyro_x', 'gyro_x', 'gyroX', 'GyroX', 'GYRO_X'],
    'blackbox.sensor_values.gyro_y': ['blackbox.sensor_values.gyro_y', 'gyro_y', 'gyroY', 'GyroY', 'GYRO_Y'],
    'blackbox.sensor_values.gyro_z': ['blackbox.sensor_values.gyro_z', 'gyro_z', 'gyroZ', 'GyroZ', 'GYRO_Z'],
    'blackbox.feedback_ctrler_.vel_x': ['blackbox.feedback_ctrler_.vel_x', 'feedback_ctrler_vel_x', 'velX_I', 'feedback_vel_x'],
    'blackbox.feedback_ctrler_.vel_y': ['blackbox.feedback_ctrler_.vel_y', 'feedback_ctrler_vel_y', 'velY_S'],
    'blackbox.feedback_ctrler_.vel_z': ['blackbox.feedback_ctrler_.vel_z', 'feedback_ctrler_vel_z', 'velZ_S'],
    'blackbox.target_ctrler_.vel_x': ['blackbox.target_ctrler_.vel_x', 'target_ctrler_vel_x', 'velX_S', 'target_vel_x'],
    'blackbox.sensor_values.gps_data.hori_dop': ['blackbox.sensor_values.gps_data.hori_dop', 'hori_dop', 'HDOP', 'hDOP'],
    'blackbox.sensor_values.gps_data.vert_dop': ['blackbox.sensor_values.gps_data.vert_dop', 'vert_dop', 'VDOP', 'vDOP'],
    'blackbox.sensor_values.gps_data.satellite_num': ['blackbox.sensor_values.gps_data.satellite_num', 'satellite_num', 'sats', 'numSat', 'Sats'],
    'blackbox.sensor_values.gps_data.altitude': ['blackbox.sensor_values.gps_data.altitude', 'altitude', 'alt', 'Altitude'],
    'blackbox.sensor_values.gps_data.latitude': ['blackbox.sensor_values.gps_data.latitude', 'latitude', 'lat', 'Latitude'],
    'blackbox.sensor_values.gps_data.longitude': ['blackbox.sensor_values.gps_data.longitude', 'longitude', 'lon', 'lng', 'Longitude'],
    'blackbox.sensor_values.vehicle_optical_flow.of_distance_m': ['blackbox.sensor_values.vehicle_optical_flow.of_distance_m', 'of_distance_m'],
    'blackbox.sensor_values.accel_x': ['blackbox.sensor_values.accel_x', 'acc_x', 'accel_x', 'blackbox.ins_information.acc_x'],
    'blackbox.sensor_values.accel_y': ['blackbox.sensor_values.accel_y', 'acc_y', 'accel_y', 'blackbox.ins_information.acc_y'],
    'blackbox.sensor_values.accel_z': ['blackbox.sensor_values.accel_z', 'acc_z', 'accel_z', 'blackbox.ins_information.acc_z'],

    // Impact
    'blackbox.armed': ['blackbox.armed', 'is_armed', 'isArmed', 'ARMED', 'armed', 'is_arm', 'blackbox.receiver_panel.is_armed'],
    'blackbox.vibr_.x': ['blackbox.vibr_.x', 'vibr_x', 'vibration_x', 'VibrX', 'VibrationX', 'VIBR_X'],
    'blackbox.vibr_.y': ['blackbox.vibr_.y', 'vibr_y', 'vibration_y', 'VibrY', 'VibrationY', 'VIBR_Y'],
    'blackbox.vibr_.z': ['blackbox.vibr_.z', 'vibr_z', 'vibration_z', 'VibrZ', 'VibrationZ', 'VIBR_Z'],
    'blackbox.sensor_values.magnet_x': ['blackbox.sensor_values.magnet_x', 'magnet_x', 'MagX', 'mag_x'],
    'blackbox.sensor_values.magnet_y': ['blackbox.sensor_values.magnet_y', 'magnet_y', 'MagY', 'mag_y'],
    'blackbox.sensor_values.magnet_z': ['blackbox.sensor_values.magnet_z', 'magnet_z', 'MagZ', 'mag_z'],

    // Control Input
    'blackbox.receiver_panel.ail_value': ['blackbox.receiver_panel.ail_value', 'ail_value', 'AIL', 'Aileron', 'aileron'],
    'blackbox.receiver_panel.ele_value': ['blackbox.receiver_panel.ele_value', 'ele_value', 'ELE', 'Elevator', 'elevator'],
    'blackbox.receiver_panel.rud_value': ['blackbox.receiver_panel.rud_value', 'rud_value', 'RUD', 'Rudder', 'rudder'],
    'blackbox.receiver_panel.thr_value': ['blackbox.receiver_panel.thr_value', 'thr_value', 'THR', 'Throttle', 'throttle'],
    'blackbox.receiver_panel.flight_mode': ['blackbox.receiver_panel.flight_mode', 'flight_mode', 'FlightMode', 'flightMode', 'mode'],
    'blackbox.receiver_panel.velocity_x': ['blackbox.receiver_panel.velocity_x', 'x_velocity', 'vel_x', 'velocityX', 'VelX', 'vx', 'blackbox.ins_information.gps_v_x'],
    'blackbox.receiver_panel.velocity_y': ['blackbox.receiver_panel.velocity_y', 'y_velocity', 'vel_y', 'velocityY', 'VelY', 'vy', 'blackbox.ins_information.gps_v_y'],
    'blackbox.receiver_panel.velocity_z': ['blackbox.receiver_panel.velocity_z', 'z_velocity', 'vel_z', 'velocityZ', 'VelZ', 'vz', 'blackbox.ins_information.gps_v_z'],
};

export interface DataKeyMetadata {
    label: string;
    unit: string;
    description: string;
    transform?: (value: number) => number;
    isStateful?: boolean;
    statefulTransform?: (value: number, context: { initialAltitude: number }) => number;
}

export const DATA_KEY_METADATA: Record<string, DataKeyMetadata> = {
    // --- Keys requiring transformation ---
    // Attitude & Gyro (Radians to Degrees)
    'blackbox.attitude.roll': {
        label: '滾轉角', unit: '°', description: '將弧度 (radian) 轉換為角度 (degree)',
        transform: (value) => value * 57.3,
    },
    'blackbox.attitude.pitch': {
        label: '俯仰角', unit: '°', description: '將弧度 (radian) 轉換為角度 (degree)',
        transform: (value) => value * 57.3,
    },
    'blackbox.attitude.yaw': {
        label: '偏航角', unit: '°', description: '將弧度 (radian) 轉換為角度 (degree)',
        transform: (value) => value * 57.3,
    },
    'blackbox.rat_ctrl_cmd_.z': {
        label: '速率指令 Z', unit: '°/s', description: '將弧度/秒 (rad/s) 轉換為角度/秒 (deg/s)',
        transform: (value) => value * 57.3,
    },
    'blackbox.sensor_values.gyro_z': {
        label: '陀螺儀 Z', unit: '°/s', description: '將弧度/秒 (rad/s) 轉換為角度/秒 (deg/s)',
        transform: (value) => value * 57.3,
    },
    'blackbox.sensor_values.gyro_x': {
        label: '陀螺儀 X', unit: '°/s', description: '將弧度/秒 (rad/s) 轉換為角度/秒 (deg/s)',
        transform: (value) => value * 57.3,
    },
    'blackbox.sensor_values.gyro_y': {
        label: '陀螺儀 Y', unit: '°/s', description: '將弧度/秒 (rad/s) 轉換為角度/秒 (deg/s)',
        transform: (value) => value * 57.3,
    },
    // RC Input (Normalization to Percentage)
    'blackbox.receiver_panel.ail_value': {
        label: '副翼指令', unit: '%', description: '將原始值 (-0.55 ~ 0.55) 標準化為百分比',
        transform: (value) => (value / 0.55) * 100,
    },
    'blackbox.receiver_panel.ele_value': {
        label: '升降舵指令', unit: '%', description: '將原始值 (-0.55 ~ 0.55) 標準化為百分比',
        transform: (value) => (value / 0.55) * 100,
    },
    'blackbox.receiver_panel.rud_value': {
        label: '方向舵指令', unit: '%', description: '將原始值 (-0.55 ~ 0.55) 標準化為百分比',
        transform: (value) => (value / 0.55) * 100,
    },
    'blackbox.receiver_panel.thr_value': {
        label: '油門指令', unit: '%', description: '將 PWM 值 (10500 ~ 19500) 標準化為百分比，中心點為 15000',
        transform: (value) => ((value - 15000) / 4500) * 100,
    },
    // Altitude (Absolute to Relative)
    'blackbox.sensor_values.gps_data.altitude': {
        label: '相對高度', unit: 'm', description: '以首筆有效數據為基準點 0m，計算相對高度',
        isStateful: true,
        statefulTransform: (value, context) => value - context.initialAltitude,
    },
    'blackbox.sensor_values.vehicle_optical_flow.of_distance_m': { label: '光流高度', unit: 'm', description: '光學流量感測器測得的離地高度' },

    // --- Keys without transformation (for future UI driving) ---
    'blackbox.motor[0]': { label: '馬達 1', unit: 'PWM', description: '飛控輸出的原始 PWM 指令值' },
    'blackbox.motor[1]': { label: '馬達 2', unit: 'PWM', description: '飛控輸出的原始 PWM 指令值' },
    'blackbox.motor[2]': { label: '馬達 3', unit: 'PWM', description: '飛控輸出的原始 PWM 指令值' },
    'blackbox.motor[3]': { label: '馬達 4', unit: 'PWM', description: '飛控輸出的原始 PWM 指令值' },
    'blackbox.esc_info.esc[0].current': { label: '電變 1 電流', unit: 'A', description: '電變回傳的電流值' },
    'blackbox.armed': { label: '解鎖狀態', unit: '', description: '飛行器是否解鎖' },
    'blackbox.vibr_.x': { label: '震動 X', unit: 'm/s²', description: 'X 軸向的震動值' },
    'blackbox.sensor_values.accel_x': { label: '加速度 X', unit: 'm/s²', description: 'X 軸向的加速度值' },
    'blackbox.sensor_values.accel_y': { label: '加速度 Y', unit: 'm/s²', description: 'Y 軸向的加速度值' },
    'blackbox.sensor_values.accel_z': { label: '加速度 Z', unit: 'm/s²', description: 'Z 軸向的加速度值' },
    'blackbox.sensor_values.magnet_x': { label: '磁力 X', unit: '', description: '磁力計 X 軸讀數' },
    'blackbox.sensor_values.magnet_y': { label: '磁力 Y', unit: '', description: '磁力計 Y 軸讀數' },
    'blackbox.sensor_values.magnet_z': { label: '磁力 Z', unit: '', description: '磁力計 Z 軸讀數' },
    'magnet_total': { label: '磁力總強度 (平方和)', unit: '', description: '磁力計三軸平方和 (x²+y²+z²)' },
    'blackbox.feedback_ctrler_.vel_x': { label: '反饋速度 X', unit: 'm/s', description: '反饋控制器 X 軸速度' },
    'blackbox.feedback_ctrler_.vel_y': { label: '反饋速度 Y', unit: 'm/s', description: '反饋控制器 Y 軸速度' },
    'blackbox.feedback_ctrler_.vel_z': { label: '反饋速度 Z', unit: 'm/s', description: '反饋控制器 Z 軸速度' },
};


export const ALL_DATA_KEYS = [
    'time', 'unix_time',
    'blackbox.motor[0]', 'blackbox.motor[1]', 'blackbox.motor[2]', 'blackbox.motor[3]',
    'blackbox.esc_info.esc[0].current', 'blackbox.esc_info.esc[1].current', 'blackbox.esc_info.esc[2].current', 'blackbox.esc_info.esc[3].current',
    'blackbox.esc_info.esc[0].step_time', 'blackbox.esc_info.esc[1].step_time', 'blackbox.esc_info.esc[2].step_time', 'blackbox.esc_info.esc[3].step_time',
    'blackbox.esc_info.esc[0].voltage', 'blackbox.esc_info.esc[1].voltage', 'blackbox.esc_info.esc[2].voltage', 'blackbox.esc_info.esc[3].voltage',
    'blackbox.esc_info.esc[0].temperature', 'blackbox.esc_info.esc[1].temperature', 'blackbox.esc_info.esc[2].temperature', 'blackbox.esc_info.esc[3].temperature',
    'blackbox.fs_act', 'blackbox.error', 'blackbox.rat_ctrl_cmd_.z', 'blackbox.sensor_values.gyro_z', 'blackbox.sensor_values.gyro_x', 'blackbox.sensor_values.gyro_y',
    'blackbox.feedback_ctrler_.vel_x', 'blackbox.feedback_ctrler_.vel_y', 'blackbox.feedback_ctrler_.vel_z', 'blackbox.target_ctrler_.vel_x',
    'blackbox.sensor_values.gps_data.hori_dop', 'blackbox.sensor_values.gps_data.vert_dop', 'blackbox.armed',
    'blackbox.vibr_.x', 'blackbox.vibr_.y', 'blackbox.vibr_.z',
    'blackbox.sensor_values.accel_x', 'blackbox.sensor_values.accel_y', 'blackbox.sensor_values.accel_z',
    'blackbox.receiver_panel.ail_value', 'blackbox.receiver_panel.ele_value', 'blackbox.receiver_panel.rud_value', 'blackbox.receiver_panel.thr_value',
    'blackbox.receiver_panel.flight_mode', 'blackbox.receiver_panel.velocity_x', 'blackbox.receiver_panel.velocity_y', 'blackbox.receiver_panel.velocity_z',
    'blackbox.sensor_values.gps_data.longitude', 'blackbox.sensor_values.gps_data.latitude', 'blackbox.sensor_values.gps_data.altitude',
    'blackbox.attitude.roll', 'blackbox.attitude.pitch', 'blackbox.attitude.yaw',
    'blackbox.sensor_values.vehicle_optical_flow.of_distance_m',
    'blackbox.sensor_values.magnet_x', 'blackbox.sensor_values.magnet_y', 'blackbox.sensor_values.magnet_z'
];

export const CHART_DEFINITIONS: Record<string, ChartDefinition[]> = {
    power: [
        { id: 'motor', title: '馬達轉速(飛控指令)', yLabel: '指令(PWM)', datasets: [
            { key: 'blackbox.motor[0]', label: '馬達 1' }, { key: 'blackbox.motor[1]', label: '馬達 2' },
            { key: 'blackbox.motor[2]', label: '馬達 3' }, { key: 'blackbox.motor[3]', label: '馬達 4' }
        ]},
        { id: 'current', title: '電變電流 (A)', yLabel: '電流 (A)', datasets: [
            { key: 'blackbox.esc_info.esc[0].current', label: '電變 1' }, { key: 'blackbox.esc_info.esc[1].current', label: '電變 2' },
            { key: 'blackbox.esc_info.esc[2].current', label: '電變 3' }, { key: 'blackbox.esc_info.esc[3].current', label: '電變 4' }
        ]},
        { id: 'esc_time', title: '電變步階時間', yLabel: '狀態', datasets: [
            { key: 'blackbox.esc_info.esc[0].step_time', label: '電變 1' }, { key: 'blackbox.esc_info.esc[1].step_time', label: '電變 2' },
            { key: 'blackbox.esc_info.esc[2].step_time', label: '電變 3' }, { key: 'blackbox.esc_info.esc[3].step_time', label: '電變 4' }
        ]},
        { id: 'voltage', title: '電變電壓 (V)', yLabel: '電壓 (V)', datasets: [
            { key: 'blackbox.esc_info.esc[0].voltage', label: '電變 1' }, { key: 'blackbox.esc_info.esc[1].voltage', label: '電變 2' },
            { key: 'blackbox.esc_info.esc[2].voltage', label: '電變 3' }, { key: 'blackbox.esc_info.esc[3].voltage', label: '電變 4' }
        ]},
        { id: 'temp', title: '電變溫度 (°C)', yLabel: '溫度 (°C)', datasets: [
            { key: 'blackbox.esc_info.esc[0].temperature', label: '電變 1' }, { key: 'blackbox.esc_info.esc[1].temperature', label: '電變 2' },
            { key: 'blackbox.esc_info.esc[2].temperature', label: '電變 3' }, { key: 'blackbox.esc_info.esc[3].temperature', label: '電變 4' }
        ]}
    ],
    flight_control: [
        { id: 'attitude', title: '姿態角度', yLabel: '角度 (°)', datasets: [
            { key: 'blackbox.attitude.roll', label: '滾轉 (Roll)' },
            { key: 'blackbox.attitude.pitch', label: '俯仰 (Pitch)' },
            { key: 'blackbox.attitude.yaw', label: '偏航 (Yaw)' }
        ]},
        { id: 'altitude', title: '高度', yLabel: '相對高度 (m)', datasets: [
            { key: 'blackbox.sensor_values.gps_data.altitude', label: '高度' }
        ]},
        { id: 'acceleration', title: '加速度', yLabel: '加速度 (m/s²)', datasets: [
            { key: 'blackbox.sensor_values.accel_x', label: '加速度 X' },
            { key: 'blackbox.sensor_values.accel_y', label: '加速度 Y' },
            { key: 'blackbox.sensor_values.accel_z', label: '加速度 Z' }
        ]},
        { id: 'optical_flow_altitude', title: '光流高度', yLabel: '高度 (m)', datasets: [
            { key: 'blackbox.sensor_values.vehicle_optical_flow.of_distance_m', label: '光流高度' }
        ]},
        { id: 'fs_error', title: '失控保護 & 錯誤', yLabel: '失控保護狀態', yLabelRight: '錯誤碼', isStepped: true, datasets: [
            { key: 'blackbox.fs_act', label: '失控保護觸發', yAxisId: 'left' }, { key: 'blackbox.error', label: '錯誤', yAxisId: 'right' }
        ]},
        { id: 'yaw_rate', title: '偏航速率控制', yLabel: '速率 (°/s)', datasets: [
            { key: 'blackbox.rat_ctrl_cmd_.z', label: '速率指令 Z' }, { key: 'blackbox.sensor_values.gyro_z', label: '陀螺儀 Z' }
        ]},
        { id: 'vel_x', title: 'X軸速度 (目標 vs 反饋)', yLabel: '速度 (m/s)', datasets: [
            { key: 'blackbox.feedback_ctrler_.vel_x', label: '反饋速度 X' }, { key: 'blackbox.target_ctrler_.vel_x', label: '目標速度 X' }
        ]},
        { id: 'dop', title: 'GPS DOP', yLabel: 'DOP 值', datasets: [
            { key: 'blackbox.sensor_values.gps_data.hori_dop', label: '水平 DOP' }, { key: 'blackbox.sensor_values.gps_data.vert_dop', label: '垂直 DOP' }
        ]},
        { id: 'feedback_velocity_3axis', title: '反饋速度 (三軸)', yLabel: '速度 (m/s)', datasets: [
            { key: 'blackbox.feedback_ctrler_.vel_x', label: 'X 軸' },
            { key: 'blackbox.feedback_ctrler_.vel_y', label: 'Y 軸' },
            { key: 'blackbox.feedback_ctrler_.vel_z', label: 'Z 軸' }
        ]},
    ],
    impact: [
         { id: 'fs_error_impact', title: '失控保護 & 錯誤', yLabel: '失控保護狀態', yLabelRight: '錯誤碼', isStepped: true, datasets: [
            { key: 'blackbox.fs_act', label: '失控保護觸發', yAxisId: 'left' }, { key: 'blackbox.error', label: '錯誤', yAxisId: 'right' }
        ]},
        { id: 'armed', title: '解鎖狀態', yLabel: '狀態', isStepped: true, datasets: [
            { key: 'blackbox.armed', label: '已解鎖' }
        ]},
        { id: 'vibration', title: '震動', yLabel: 'm/s/s', datasets: [
            { key: 'blackbox.vibr_.x', label: '震動 X' }, { key: 'blackbox.vibr_.y', label: '震動 Y' }, { key: 'blackbox.vibr_.z', label: '震動 Z' }
        ]},
        { id: 'gyro_impact', title: '陀螺儀', yLabel: '速率 (°/s)', datasets: [
            { key: 'blackbox.sensor_values.gyro_x', label: '陀螺儀 X' }, { key: 'blackbox.sensor_values.gyro_y', label: '陀螺儀 Y' }, { key: 'blackbox.sensor_values.gyro_z', label: '陀螺儀 Z' }
        ]},
        { id: 'magnet_impact', title: '磁力計 (異常偵測)', yLabel: '強度 (平方和)', yLabelRight: '分量值', datasets: [
            { key: 'magnet_total', label: '總強度', yAxisId: 'left' },
            { key: 'blackbox.sensor_values.magnet_x', label: 'X 分量', yAxisId: 'right' },
            { key: 'blackbox.sensor_values.magnet_y', label: 'Y 分量', yAxisId: 'right' },
            { key: 'blackbox.sensor_values.magnet_z', label: 'Z 分量', yAxisId: 'right' }
        ]}
    ],
    control_input: [
        { id: 'rc_stick', title: '遙控器搖桿輸入', yLabel: '指令 (%)', datasets: [
            { key: 'blackbox.receiver_panel.ail_value', label: '副翼' }, { key: 'blackbox.receiver_panel.ele_value', label: '升降舵' },
            { key: 'blackbox.receiver_panel.rud_value', label: '方向舵' }, { key: 'blackbox.receiver_panel.thr_value', label: '油門' }
        ]},
        { id: 'flight_mode', title: '飛行模式', yLabel: '模式 ID', isStepped: true, datasets: [
            { key: 'blackbox.receiver_panel.flight_mode', label: '模式' }
        ]},
        { id: 'gyro_control', title: '陀螺儀', yLabel: '速率 (°/s)', datasets: [
            { key: 'blackbox.sensor_values.gyro_x', label: '陀螺儀 X' }, { key: 'blackbox.sensor_values.gyro_y', label: '陀螺儀 Y' }, { key: 'blackbox.sensor_values.gyro_z', label: '陀螺儀 Z' }
        ]},
        { id: 'velocity', title: '遙控輸入速度', yLabel: '速度 (m/s)', datasets: [
            { key: 'blackbox.receiver_panel.velocity_x', label: '速度 X' }, { key: 'blackbox.receiver_panel.velocity_y', label: '速度 Y' }, { key: 'blackbox.receiver_panel.velocity_z', label: '速度 Z' }
        ]}
    ]
};

export const DATA_COLORS = [
    '#3b82f6', // blue-500
    '#22c55e', // green-500
    '#f97316', // orange-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#14b8a6', // teal-500
    '#ef4444', // red-500
];
