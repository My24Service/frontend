<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="truck"></b-icon>
          Docks
        </h3>
      </div>
    </header>
    <div class='page-detail flex-columns'>
      <div class='panel'>
        <h6>Door movements</h6>
        <ul class='listing'>
          <li>
            <div class="headings">
            <span>movement</span><span>date</span><span>duration</span>
          </div>
          </li>
          <li v-for="item in movements">
            <div class="listing-item">
              <strong class="">{{ item.type }}</strong>
              <datetime class="order-start-date">{{ item.date }} {{ item.time }}</datetime>
              <span>{{ formatDuration(item.duration)}}</span>
            </div>
          </li>
        </ul>
      </div>
      <div class='panel'>
        <h6>Inventory</h6>
        <ul class='listing'>
          <li v-for="item in inventory">
            <div class="listing-item">
              <strong class="">{{ item.name }}</strong>
              <datetime class="order-start-date">{{ item.date }} {{ item.time }}</datetime>
              <span>{{ formatDuration(item.duration)}}</span>
            </div>
          </li>
        </ul>
      </div>
      <div class='panel'>
        <h6>Inventory</h6>
        <ul class='listing'>
          <li v-for="item in activity">
            <div class="listing-item">
              <strong class="">{{ item.type }}</strong>
              <span>{{ item.location  }}</span>
              <datetime>{{ item.date }} {{ item.time }}</datetime>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
  strong,
  datetime,
  span {
    width: 5rem;
  }
  
  span {text-align: end;}
</style>

<script>
export default {
  name: 'DocksDashboard',
  data() {
    return {
      movements: [
        {type:"close", date: '2023-08-16', duration: 30},
        {type:"open", date: '2023-08-16', duration: 1312},
        {type:"close", date: '2023-08-16', duration: 31},
        {type:"open", date: '2023-08-16', duration: 1412},
        {type:"close", date: '2023-08-15', duration: 32},
        {type:"open", date: '2023-08-15', duration: 1312},
        {type:"close", date: '2023-08-13', duration: 30},
        {type:"open", date: '2023-08-13', duration: 13102},
      ],
      inventory: [
        {name: "Productnaam", duration: 259200},
        {name: "Productnaam", duration: 259200},
        {name: "Productnaam", duration: 259200},
        {name: "Productnaam", duration: 259200},
      ],
      activity: [
        {type: "maintenance", location: "dock 2", date: "2023-01-10"},
        {type: "defect", location: "dock 1", date: "2023-01-10"},
        {type: "maintenance", location: "dock 2", date: "2023-01-10"},
        {type: "repairs", location: "dock 1", date: "2023-01-10"},
        {type: "maintenance", location: "dock 2", date: "2023-01-10"},
        {type: "repeairs", location: "dock 1", date: "2023-01-10"},
        {type: "maintenance", location: "dock 2", date: "2023-01-10"},
        {type: "maintenance", location: "dock 2", date: "2023-01-10"},
      ]
    }
  },
  methods: {
    formatDuration(duration) {
      let time = duration;
      const hours = Math.floor(time / 3600);
      time = time - hours * 3600;
      const minutes = Math.floor(time / 60);
      const seconds = time - minutes * 60;

      return `${hours ? hours + ':' : ''}${minutes ? minutes + ':' : '0:'}${seconds}`
    }
  }
}
</script>