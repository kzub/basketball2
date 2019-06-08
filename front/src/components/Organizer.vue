<template>
  <div class="d-flex flex-row">
    <div>Организатор:</div>
    <div>
      <div class="flex-column">
        <div class="pl-1">
          {{ name }}
        </div>
        <div class="pl-1">
          {{ phone }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Organizer',
  props: ['name', 'phone'],
}
</script>
