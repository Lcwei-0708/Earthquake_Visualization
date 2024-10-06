<template>
    <div class="header">
        <button @click="toggleTheme" class="theme-button">
            <iconify-icon :icon="themeIcon" class="icon"></iconify-icon>
        </button>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
    setup() {
        const isDarkTheme = ref(false);

        onMounted(() => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                isDarkTheme.value = savedTheme === 'dark';
            } else {
                localStorage.setItem('theme', 'light');
            }
            updateTheme();
        });

        const themeIcon = computed(() => isDarkTheme.value ? 'ph:moon-bold' : 'gravity-ui:sun');

        function toggleTheme() {
            isDarkTheme.value = !isDarkTheme.value;
            updateTheme();
        }

        function updateTheme() {
            if (isDarkTheme.value) {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
            }
            localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light');
        }

        return {
            toggleTheme,
            themeIcon
        };
    }
};
</script>

<style scoped>
.header {
    position: absolute;
    top: 20px;
    right: 20px;
}

.theme-button {
    background-color: var(--bg2-color);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow4-color);
    color: var(--font-color);
    height: 50px;
    width: 50px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: scale 0.2s ease-in-out, box-shadow 0.1s ease-in-out;
}

.theme-button:hover {
    background-color: var(--hover-bg-color);
    box-shadow: var(--shadow5-color);
}

.theme-button:active {
    scale: 0.8;
}

.icon {
    font-size: 24px;
}

@media screen and (max-width: 768px) {
    .header {
        top: 10px;
        right: 10px;
    }
}
</style>