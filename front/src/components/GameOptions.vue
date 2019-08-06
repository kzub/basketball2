<template>
    <div>
      <b-row v-if="option.type === 'options'" class="mx-0 my-1">
        {{option.label}}
        <b-form-select v-model="storage[option.output]" :options="option.options">
          <template slot="first">
            <option :value="undefined" disabled selected>-------</option>
          </template>
        </b-form-select>
      </b-row>
      <b-row v-else class="mx-0 my-1">
        {{option.label}}
        <b-form-input
          :id="`ng-${option.output}`"
          :type="option.type"
          placeholder=""
          v-model="storage[option.output]"
        >
        </b-form-input>
      </b-row>

      <!-- additional input fileds -->
      <div v-if="storage[option.output] && storage[option.output].inputs">
        <b-row v-for="input in storage[option.output].inputs" class="mx-0 my-1">
          {{input.label}}
          <b-form-input
            :hidden="input.hidden"
            :id="`ngo-${input.output}`"
            :type="input.type"
            placeholder=""
            v-model="storage[input.output]"
          >
          </b-form-input>
        </b-row>
      </div>
    </div>
</template>

<script>
export default {
  name: 'GameOptions',
  props: ['option','storage'],
}
</script>
