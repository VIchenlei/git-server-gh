import mysql from './MysqlWraper.js'
import net from 'net'
import {
  handleUnIPBuffer,
  parsingData,
  READER_COMMAND_WORD,
  handleBuffer, 
  powerData
} from './reader_command_word.js'

export default class Power {
  constructor (powerStore) {
    this.name = null
    this.timer = null // 定时获取电源信息
    this.interval = 24 * 60 * 60 * 1000
    // this.interval = 2 * 20 * 1000
    this.powerStore = powerStore
    // this.registerEventHandler()
  }

  // registerEventHandler () {
  //   process.on('message', async (msg) => {
  //     const { cmd, data } = msg
  //     let self = this
  //     let sql = null
  //     switch (cmd) {
  //       case 'power_msg':
  //         this.getPowerMsg()
  //         this.timer = setInterval(self.getPowerMsg(self), self.interval)
  //         break
  //       case 'power_discharge':
  //         this.name = 'device_configuration'
  //         sql = `SELECT power_levels_id, ddp.device_power_id, discharge_voltage_cycle, discharge_time, ip, device_id as deviceAddress, device_type_id as deviceType FROM dat_power_levels dpl, dat_device_power ddp WHERE dpl.device_power_id = ddp.device_power_id;`
  //         const powersLevel = this.getPowers(sql)
  //         this.testDischarge(powersLevel)
  //         break
  //       case 'update_search_power_time':
  //         clearInterval(this.timer)
  //         this.interval = data.value * 60 * 60 * 1000
  //         this.timer = setInterval(self.getPowerMsg(self), self.interval)
  //         break
  //     }
  //   })
  // }
  dispatch (msg) {
    const { cmd, data } = msg
    let self = this
    let sql = null
    switch (cmd) {
      case 'power_msg':
        this.getPowerMsg()
        this.timer = setInterval(this.getPowerMsg.bind(this), this.interval)
        break
      case 'power_discharge':
        this.name = 'device_configuration'
        sql = `SELECT power_levels_id, ddp.device_power_id, discharge_voltage_cycle, discharge_time, ip, device_id as deviceAddress, device_type_id as deviceType FROM dat_power_levels dpl, dat_device_power ddp WHERE dpl.device_power_id = ddp.device_power_id;`
        const powersLevel = this.getPowers(sql)
        this.testDischarge(powersLevel)
        break
      case 'update_search_power_time':
        clearInterval(this.timer)
        this.interval = data.value * 60 * 60 * 1000
        console.log(this.interval)
        this.timer = setInterval(this.getPowerMsg.bind(this), this.interval)
        break
    }
  }

  // 获取电源信息
  async getPowerMsg () {
    this.name = 'device_power'
    const sql = `SELECT ddp.device_power_id AS deviceAddress, dr.ip, dr.reader_id AS ipDeviceAddress FROM dat_device_power ddp, dat_reader dr WHERE ddp.device_id = dr.reader_id;`
    const powers = await this.getPowers(sql)
    this.sendPowerCommand(powers, this, '1')
  }

  async testPowerDischarge (start) {
    this.name = 'power_discharge'
    const sql = `SELECT power_levels_id, ddp.device_power_id as deviceAddress, discharge_voltage_cycle, discharge_time, dr.ip, device_id, ddp.device_type_id as deviceType, dr.reader_id AS ipDeviceAddress, dr.reader_type_id AS ipDeviceType FROM dat_power_levels dpl, dat_device_power ddp, dat_reader dr WHERE dpl.device_power_id = ddp.device_power_id AND ddp.device_id = dr.reader_id;`
    const powersLevel = await this.getPowers(sql)
    this.testDischarge(powersLevel, start)
  }

  async getPowers (sql) {
    try {
      const rows = await mysql.query(sql)
      return rows
    } catch (err) {
      console.warn(err)
    }
  }

  getPowersLevel () {
    const sql = `SELECT power_levels_id, ddp.device_power_id, discharge_voltage_cycle, discharge_time, discharge_timing, ip, device_id as deviceAddress, device_type_id as deviceType FROM dat_power_levels dpl, dat_device_power ddp WHERE dpl.device_power_id = ddp.device_power_id;`
    const powersLevel = this.getPowers(sql)
    return powersLevel
  }

  getDissTime (now, time) {
    return Math.floor((now.getTime() - new Date(time).getTime()) / (24 * 60 * 60 * 1000))
  }

  // 检查放电时间
  testDischarge (powers, start) {
    if (!powers) return
    const now = new Date()
    for (let i = 0; i < powers.length; i++) {
      const power = powers[i]
      const { power_levels_id, deviceAddress, discharge_voltage_cycle, discharge_time, ip, ipDeviceAddress, deviceType } = power
      if (!start) this.updateTime(power_levels_id, deviceAddress, ipDeviceAddress)
      if (discharge_time) {
        const dissTime = this.getDissTime(now, discharge_time)
        if (Math.abs(dissTime) < discharge_voltage_cycle) continue
      }
      this.sendPowerCommand([power], this, '2')
    }
  }
  // power_rode:电路ID, deviceAddress:电源ID, originIPDeviceAddress:设备地址（所属分站ID）
  async updateTime (power_rode, deviceAddress, originIPDeviceAddress, timing) { // 更新放电时间
    const now = new Date()
    const powersLevel = await this.getPowersLevel()
    const power = powersLevel && powersLevel.find(item => item.power_levels_id === power_rode && item.device_power_id === deviceAddress)
    let { discharge_voltage_cycle, discharge_timing } = power
    discharge_timing = discharge_timing < discharge_voltage_cycle ? discharge_timing + 1 : 1
    discharge_timing = timing ? timing : discharge_timing
    let dischargeTime = new Date((now.getTime()+24 * discharge_timing * 60 * 60 * 1000)).format('yyyy-MM-dd')
    const sql = `UPDATE dat_power_levels dpl, dat_device_power ddp SET discharge_time = '${dischargeTime}', discharge_timing = ${discharge_timing} WHERE device_id = ${originIPDeviceAddress} AND power_levels_id = ${power_rode} AND ddp.device_power_id = ${deviceAddress} AND dpl.device_power_id = ddp.device_power_id;`;
    this.getPowers(sql)
  }

  updatePowerDB (result) {
    let { power_rode, deviceAddress, excharge_state, power_limit, temperature_limit, originIPDeviceAddress } = result.data
    console.log('解析电源数据：', result)
    if (!power_rode) {
      power_rode = result.data.data.power_rode
    }
    // const now = new Date().format('yyyy-MM-dd')
    let sql = ''
    if (power_rode) {
      // this.updateTime(power_rode, deviceAddress, originIPDeviceAddress)
      return
    } else {
      let values = ''
      values += excharge_state === undefined ? '' : `power_status = ${excharge_state},`
      values += power_limit === undefined ? '' : `power_limit = ${power_limit},`
      values += temperature_limit === undefined ? '' : `temperature_limit = ${temperature_limit}`
      sql = values ? `UPDATE dat_power_levels dpl, dat_device_power ddp SET ${values} WHERE device_id = ${originIPDeviceAddress} AND ddp.device_power_id = ${deviceAddress}  AND dpl.device_power_id = ddp.device_power_id;` : ''
    }
    sql && this.getPowers(sql)
  }

  sendPowerCommand (list, self, status) {
    const msg = list && list.shift()
    if (!msg) return
    self = self || this
    const { deviceAddress, ip, ipDeviceAddress } = msg
    const sendData = { deviceAddress, deviceType: 12, isIP: false }
    if (this.name === 'power_discharge') {
      const { power_levels_id } = msg
      sendData['data'] = {}
      sendData['data']['power_rode'] = power_levels_id
    }
    const tcpClient = new net.Socket()
    const commandWord = READER_COMMAND_WORD[self.name]

    if (!ip) return
    tcpClient.connect(6000, ip, () => {
      const ipDeviceMap = new Map()
      ipDeviceMap.set(ip, {
        ipDeviceAddress: ipDeviceAddress,
        ipDeviceType: 1
      })
      const sendMag = handleBuffer(commandWord, self.name, sendData)
      const {resultBuffer} = handleUnIPBuffer(commandWord, self.name, sendData, sendMag, ipDeviceMap, ip)
      tcpClient.write(resultBuffer)
      if (status == '2') {
        console.log('resultBuffer------------------', resultBuffer)
        tcpClient.destroy()
      }
    })

    tcpClient.on('data', (data) => {
      const isPowerData = powerData(data)
      if (!isPowerData) return
      console.log('接收到的电源消息', data)
      let parsingResult = parsingData(data, self.name)
      self.updatePowerDB(parsingResult)
      self.powerStore.storePower(parsingResult)
      tcpClient.destroy()
    })

    tcpClient.on('error', error => {
      console.warn(`连接失败${ip}:6000:${error}`)
      tcpClient.destroy()
    })

    tcpClient.on('close', () => {
      if (list.length > 0) {
        self.sendPowerCommand(list, self)
      }
      console.log('关闭电源连接', ip)
    })
  }
}
