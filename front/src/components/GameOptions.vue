<template>
    <div>
      <b-row v-if="option.type === 'options'" class="mx-0 my-1 text-left">
        {{option.label}}
        <b-form-select required
          v-model="storage[option.output]"
          :options="option.options"
        >
          <template slot="first">
            <option :value="undefined" disabled selected>-------</option>
          </template>
        </b-form-select>
      </b-row>
      <b-row v-else class="mx-0 my-1 text-left">
        {{option.label}}
        <b-form-input required
          :type="option.type"
          v-model="storage[option.output]"
        >
        </b-form-input>
      </b-row>

      <!-- additional input fileds -->
      <div v-if="storage[option.output] && storage[option.output].inputs">
        <b-row v-for="input in storage[option.output].inputs" class="mx-0 my-1 text-left"
          :key="input.label"
          :hidden="input.hidden">
          {{input.label}}
          <b-form-input required
            :disabled="input.disabled"
            :hidden="input.hidden"
            :type="input.type"
            :value="checkInputStorage(option.output, input.output, input.value)"
            v-model="storage[option.output].inputResults[input.output]"
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
  methods: {
    // need for disabled fields to fill up storage value without user action
    checkInputStorage: function (optionKey, inputKey, value) {
      if (!this.storage[optionKey].inputResults) {
        this.storage[optionKey].inputResults = {}
      }
      this.storage[optionKey].inputResults[inputKey] = value
      return value
    },
  }
}
</script>
