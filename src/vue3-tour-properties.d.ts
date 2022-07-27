import { ComponentCustomProperties } from "vue";

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $tours: Record<string, any>
    }
}