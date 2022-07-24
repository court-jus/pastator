export default {
    template: `
    <table>
      <thead>
        <tr>
          <th>&nbsp;</th>
          <th>ID</th>
          <th>Manufacturer</th>
          <th>Name</th>
          <th>Direction</th>
          <th>Version</th>
          <th>Connection</th>
          <th>State</th>
        </tr>
      </thead>

      <tbody id="output">
        <tr v-for="port in ports" :key="port.id">
            <td>oui</td>
        </tr>
      </tbody>
    </table>
    `,
    data() {
        return {
            ports: [
                {id: "a"},
                {id: "b"}
            ]
        }
    }
}