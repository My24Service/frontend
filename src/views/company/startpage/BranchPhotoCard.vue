<template>
  <div class="col mb-4">
    <div class="card gebouwpas-card">
      <div class="card-header py-3 px-1">
        <h6 class="mb-0 text-center text-secondary">{{ title }}</h6>
      </div>

      <div class="card-body p-3">
        <!-- Tabs navs -->
        <ul class="nav nav-tabs mb-0" role="tablist">
          <li class="nav-item" role="presentation">
            <a
              class="nav-link p-2"
              :class="{ active: activeTab === 'adres' }"
              href="#"
              @click.prevent="activeTab = 'adres'"
            >Adres</a>
          </li>
          <li class="nav-item" role="presentation">
            <a
              class="nav-link p-2"
              :class="{ active: activeTab === 'informatie' }"
              href="#"
              @click.prevent="activeTab = 'informatie'"
            >Informatie</a>
          </li>
        </ul>

        <!-- Tabs content -->
        <div class="tab-content">
          <!-- Adres tab -->
          <div v-show="activeTab === 'adres'" class="tab-pane fade" :class="{ 'show active': activeTab === 'adres' }">
            <img class="img-fluid" :src="imageUrl" :alt="buildingName" />

            <ul class="list-group list-group-light list-group-small">
              <li class="list-group-item px-1 text-secondary fw-bold">{{ buildingName }}</li>
              <li class="list-group-item px-1 small">{{ street }}</li>
              <li class="list-group-item px-1 small">{{ zipCity }}</li>
            </ul>

            <div class="d-grid gap-2">
              <a href="#" class="btn btn-secondary mt-2 px-1" @click.prevent>
                <span class="d-lg-none d-xxl-inline">Gebouwpas</span> openen
              </a>
            </div>
          </div>

          <!-- Informatie tab -->
          <div v-show="activeTab === 'informatie'" class="tab-pane fade" :class="{ 'show active': activeTab === 'informatie' }">
            <ul class="pt-4 list-group list-group-light list-group-small info-list">
              <li class="list-group-item px-1 small" v-for="(info, index) in infoItems" :key="index">
                <b class="info-label">{{ info.label }}:</b> {{ info.value }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BranchPhotoCard',
  props: {
    title: {
      type: String,
      default: 'Locatie'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    buildingName: {
      type: String,
      default: ''
    },
    street: {
      type: String,
      default: ''
    },
    zipCity: {
      type: String,
      default: ''
    },
    infoItems: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      activeTab: 'adres'
    }
  }
}
</script>

<style scoped>
.gebouwpas-card {
  border-radius: 4px;
  border: 1px solid #eef2f5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.gebouwpas-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.gebouwpas-card .card-header {
  background-color: transparent;
  border-bottom: 1px solid #eef2f5;
}

.gebouwpas-card .card-header h6 {
  font-size: 0.9rem;
  font-weight: 600;
}

.gebouwpas-card .nav-tabs {
  border-bottom: 1px solid #eef2f5;
}

.gebouwpas-card .nav-tabs .nav-link {
  font-size: 0.8rem;
  color: #828282;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-weight: 500;
  padding: 0.5rem;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.gebouwpas-card .nav-tabs .nav-link:hover {
  color: #828282;
  border-bottom-color: #828282;
}

.gebouwpas-card .nav-tabs .nav-link.active {
  color: #1e3a7b;
  border-bottom: 2px solid #1e3a7b;
  background: transparent;
}

.gebouwpas-card .tab-content .img-fluid {
  border-radius: 4px;
  margin-bottom: 0.5rem;
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.gebouwpas-card .list-group {
  border-radius: 0;
}

.gebouwpas-card .list-group-item {
  border: none;
  padding: 0.3rem 0.5rem;
  font-size: 0.82rem;
  background: transparent;
}

.gebouwpas-card .list-group-item.text-secondary.fw-bold {
  font-size: 0.9rem;
}

/* Informatie tab styling */
.gebouwpas-card .info-list .list-group-item {
  border-bottom: 1px solid #eef2f5;
  padding: 0.5rem 0.5rem;
}

.gebouwpas-card .info-list .list-group-item:last-child {
  border-bottom: none;
}

.gebouwpas-card .info-label {
  color: #179da0;
  font-weight: 600;
  font-size: 0.82rem;
}

.gebouwpas-card .btn-secondary {
  background-color: #179da0;
  border-color: #179da0;
  font-size: 0.8rem;
  padding: 0.4rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.gebouwpas-card .btn-secondary:hover {
  background-color: #1e3a7b;
  border-color: #1e3a7b;
}
</style>