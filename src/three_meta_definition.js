
const three_metadata = {
  'dat_staff': {
    name: 'dat_staff',
    fieldNames: ['ds.staff_id', 'ds.name', 'dse.card_id', 'dse.need_display', 'dse.occupation_id', 'dse.worktype_id'],
    sqlTmpl: 'select {resultFields} from dat_staff ds left join dat_staff_extend dse on dse.staff_id = ds.staff_id where 1=1 {exprString} order by ds.staff_id'
  },
  'dat_vehicle': {
    name: 'dat_vehicle',
    fieldNames: ['dv.vehicle_id', 'dv.name', 'dve.card_id', 'dv.vehicle_type_id', 'dve.need_display'],
    sqlTmpl: 'select {resultFields} from dat_vehicle dv left join dat_vehicle_extend dve on dv.vehicle_id = dve.vehicle_id where 1=1 {exprString} order by dv.vehicle_id'
  },
  'dat_reader': {
    name: 'dat_reader',
    fieldNames: ['dr.reader_id', 'dr.brief_name', 'da.map_id', 'dr.x', 'dr.y', 'dr.device_type_id'],
    sqlTmpl: 'select {resultFields} from dat_reader dr left join dat_area da on da.area_id = dr.area_id where 1=1 {exprString} order by dr.reader_id'
  },
  'dat_light': {
    name: 'dat_light',
    fieldNames: ['dl.light_id', 'dl.name', 'da.map_id', 'dl.x', 'dl.y', 'dl.physics_light_id'],
    sqlTmpl: 'select {resultFields} from dat_light dl left join dat_lights_group dlg on dlg.lights_group_id = dl.lights_group_id left join dat_area da on da.area_id = dlg.area_id where 1=1 {exprString} order by dl.light_id'
  },
  'dat_device_power': {
    name: 'dat_device_power',
    fieldNames: ['device_power_id', 'power_model', 'map_id', 'x', 'y'],
    sqlTmpl: 'select {resultFields} from dat_device_power where 1=1 {exprString} order by device_power_id'
  },
  'dat_obj_type': {
    name: 'dat_obj_type',
    fieldNames: ['obj_type_id', 'name'],
    sqlTmpl: 'select {resultFields} from dat_obj_type where 1=1 {exprString} order by obj_type_id'
  }
}

module.exports = three_metadata
