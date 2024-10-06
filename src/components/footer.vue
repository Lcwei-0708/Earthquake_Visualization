<template>
    <footer class="footer">
        <p>資料來源：中央氣象署</p>
        <div class="container">
            <div class="copyright">
                &copy; Copyright <strong><span>Cheng-Wei Lin</span></strong>
            </div>
            <div class="footer-icon">
                <a href="https://github.com/Lcwei-0708/Earthquake_Visualization" target="_blank">
                    <iconify-icon icon="mdi:github" class="icon"></iconify-icon>
                </a>
            </div>
        </div>
    </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
    color: var(--font-color);
    font-size: 14px;
    text-align: center;
    padding: 0px 0 20px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
}

.container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}   

.footer span {
    font-weight: bolder;
}

.footer .copyright {
    margin: 0;
}

.footer-icon {
    display: flex;
    justify-content: center;
    align-items: center;
}

.footer-icon .icon {
    font-size: 20px;
    color: var(--font-color);
    vertical-align: middle;
}
</style>