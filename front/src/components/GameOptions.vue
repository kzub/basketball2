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
          :placeholder="option.placeholder"
          v-model="storage[option.output]"
        >
        </b-form-input>
      </b-row>

      <!-- additional input fileds -->
      <div v-if="hasInputs()">
        <b-row v-for="input in storage[option.output].inputs"
          :key="input.label"
          :hidden="input.hidden"
          class="mx-0 my-1 text-left"
        >
          {{input.label}}
          <b-form-input required
            :disabled="input.disabled"
            :hidden="input.hidden"
            :type="input.type"
            :placeholder="input.placeholder"
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
    hasInputs: function () {
      // check if selected item has inputs in model
      // this.storage[this.option.output] - points to currently selected item
      if (!this.storage[this.option.output] || !this.storage[this.option.output].inputs) {
        return false
      }
      if (!this.storage[this.option.output].inputResults) {
        this.storage[this.option.output].inputResults = {}
      }
      return true
    },
    // need for disabled fields to fill up storage value without user action
    checkInputStorage: function (optionKey, inputKey, value) {
      if (value !== undefined) {
        this.storage[optionKey].inputResults[inputKey] = value
      }
      return this.storage[optionKey].inputResults[inputKey] // otherwise if already selected, value will be rewritten by default value (undefined)
    },
  }
}
</script>
