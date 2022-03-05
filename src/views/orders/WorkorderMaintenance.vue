<template>
    <div class="pdf-container" v-if="data">
        <div class="row">
            <div class="col-sm-2 logo">
                <img class="thumbnail" :src="data.member.companylogo_url" style="border:0; height: 120px;" :alt="data.member.name" />
            </div>

            <div class="col-sm-4 info">
                <b>{{ data.member.name }}</b><br/>
                {{ data.member.address }}<br/>
                {{ data.member.postal }} {{ data.member.city }}<br/>
                {{ data.member.tel }} - {{ data.member.email}}
            </div>
            <div class="col-sm-6 panel panel-default">
              <div class="panel-body">
                  <div class="row">
                    <span class="pull-left col-sm-4"><b>{{ $trans('Service number') }}</b></span>
                    <span class="col-sm-6 underline">
                        <span class="pull-right">{{ data.assigned_order_workorder_id }}</span>
                    </span>
                  </div>
                  <div class="row">
                    <span class="pull-left col-sm-4"><b>{{ $trans('Order reference') }}</b></span>
                    <span class="col-sm-6 underline">
                        <span class="pull-right">{{ data.order.order_reference }}&nbsp;</span>
                    </span>
                  </div>
              </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-6">
              <div class="row">
                <div class="pull-left col-sm-6"><b>{{ $trans('Customer ID') }}</b></div>
                <div class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order.customer_id }}</span>
                </div>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Customer') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order.order_name }}</span>
                </span>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Address') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order.order_address }}</span>
                </span>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Postal') }}/{{ $trans('city') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order.order_country_code }}-{{ data.order.order_postal }} {{ data.order.order_city }}</span>
                </span>
              </div>
            </div>
            <div class="col-sm-6">
              <div class="row">
                <div class="pull-left col-sm-6"><b>{{ $trans('Order number') }}</b></div>
                <div class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order.order_id }}</span>
                </div>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Order type') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order.order_type }}</span>
                </span>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Date') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order.order_date }}</span>
                </span>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Contact') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order.order_contact }}</span>
                </span>
              </div>
            </div>
        </div>

        <div class="row" v-if="data.order.orderlines.length">
            <p><b>{{ $trans('Orderlines') }}</b></p>
            <table class="table table-bordered">
                <thead>
                    <th>{{ $trans('Equipment') }}</th>
                    <th>{{ $trans('Location') }}</th>
                    <th>{{ $trans('Remarks') }}</th>
                </thead>
                <tbody>
                    <tr v-for="orderline in data.order.orderlines" :key="orderline.id">
                        <td>{{ orderline.product }}</td>
                        <td>{{ orderline.location }}</td>
                        <td>{{ orderline.remarks }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="row">
            <table class="table table-bordered">
                <thead>
                    <th>Date</th>
                    <th colspan="2">{{ $trans('Work hours') }}</th>
                    <th>{{ $trans('Engineer') }}</th>
                    <th colspan="2">{{ $trans('Travel time') }}</th>
                    <th>{{ $trans('Distance to') }}</th>
                    <th>{{ $trans('Distance back') }}</th>
                </thead>
                <tbody>
                    <tr>
                        <td>&nbsp;</td>
                        <td><b>{{ $trans('From') }}</b></td>
                        <td><b>{{ $trans('To') }}</b></td>
                        <td>&nbsp;</td>
                        <td><b>{{ $trans('To') }}</b></td>
                        <td><b>{{ $trans('Back') }}</b></td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                    <tr v-for="activity in data.assigned_order_activity" :key="activity.id">
                        <td>{{ activity.date }}</td>

                        <td>{{ activity.work_start }}</td>
                        <td>{{ activity.work_end }}</td>

                        <td>{{ activity.full_name }}</td>

                        <td>{{ activity.travel_to }}</td>
                        <td>{{ activity.travel_back }}</td>

                        <td>{{ activity.distance_to }}</td>
                        <td>{{ activity.distance_back }}</td>
                    </tr>
                    <tr>
                        <td><b>{{ $trans('Total') }}</b></td>
                        <td>&nbsp;</td>
                        <td><b>{{ data.assigned_order_activity_totals.work_total }}</b></td>
                        <td>&nbsp;</td>
                        <td><b>{{ data.assigned_order_activity_totals.travel_to_total }}</b></td>
                        <td><b>{{ data.assigned_order_activity_totals.travel_back_total }}</b></td>
                        <td><b>{{ data.assigned_order_activity_totals.distance_to_total }}</b></td>
                        <td><b>{{ data.assigned_order_activity_totals.distance_back_total }}</b></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="row" v-if="data.assigned_order_extra_work.length">
            <p><b>{{ $trans('Extra work') }}</b></p>
            <table class="table table-bordered">
                <thead>
                    <th>{{ $trans('Engineer') }}</th>
                    <th>{{ $trans('Description') }}</th>
                    <th>{{ $trans('Hours') }}</th>
                </thead>
                <tbody>
                    <tr v-for="extra_work in data.assigned_order_extra_work" :key="extra_work.id">
                        <td>{{ extra_work.full_name }}</td>
                        <td>{{ extra_work.extra_work_description }}</td>
                        <td>{{ extra_work.extra_work }}</td>
                    </tr>
                    <tr>
                        <td colspan="2"><b>{{ $trans('Total') }}</b></td>
                        <td><b>{{ data.assigned_order_extra_work_totals.extra_work }}</b></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="row" v-if="data.assigned_order_materials.length">
            <p><b>{{ $trans('Materials') }}</b></p>
            <table class="table table-bordered">
                <thead>
                    <th>{{ $trans('Material') }}</th>
                    <th>{{ $trans('Identfier') }}</th>
                    <th>{{ $trans('Amount') }}</th>
                </thead>
                <tbody>
                    <tr v-for="material in data.assigned_order_materials" :key="material.id">
                        <td>{{ material.name }}</td>
                        <td>{{ material.identifier }}</td>
                        <td>{{ material.amount }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="row" v-if="data.equipment.length">
            <div class="col-sm-12">
                <p><b>{{ $trans('Equipment used') }}</b></p>
                <table class="table">
                    <tr v-for="eq in data.equipment">
                        <td width="30%">{{ eq.user }}</td>
                        <td width="70%">{{ eq.equipment }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="row" v-if="data.description_work.length">
            <div class="col-sm-12">
                <p><b>{{ $trans('Description work') }}</b></p>
                <table class="table">
                    <tr v-for="work in data.description_work" :key="work.id">
                        <td width="30%">{{ work.user }}</td>
                        <td width="70%">{{ work.description_work }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="row" v-if="data.signatures">
            <div class="col-sm-12">
                <p><b>{{ $trans('Signatures') }}</b></p>
            </div>
            <div class="col-sm-6">
                <div>
                    <p>{{ $trans('Name employee') }}: {{ data.signatures.signature_name_user }}</p>
                    <hr/>
                    <p><img width="400" :src="data.signatures.signature_user"></p>
                </div>
            </div>
            <div class="col-sm-6">
                <div>
                    <p>{{ $trans('Name customer') }}: {{ data.signatures.signature_name_customer }}</p>
                    <hr/>
                    <p><img width="400" :src="data.signatures.signature_customer"></p>
                </div>
            </div>
        </div>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
    </div>    
</template>
<script>
import orderModel from '@/models/orders/Order'

export default {
  name: "WorkorderMaintenance",
  data() {
    return {
      isLoaded: false,
      data: null
    }
  },
  props: {
    uuid: {
      type: String
    }
  },
  async created() {
    this.data = await orderModel.getWorkorderData(this.uuid)
    console.log(this.data)
  }
}
</script>

<style lang="less" scoped>
@import '@/less/my24.less';

.pdf-container {
  font-size: 12px !important;
  margin-top: 4px;
  font-size: 85%;

  .log, .info {
    padding-top: 12px;
  }

  .underline {
    border-bottom: 1px dotted;
  }

  div.row {
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .panel-body {
    padding: 10px;
  }

  .signature {
    height: 150px;
  }
}
</style>
