<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span>&copy; {{ year }} IBM Research</span>
      <nav class="app-footer__links">
        <a href="https://github.com/cbomkit/cbomkit" target="_blank" rel="noopener">GitHub</a>
        <a href="https://github.com/cbomkit/cbomkit/blob/main/LICENSE.txt" target="_blank" rel="noopener">License</a>
        <a href="https://www.ibm.com/legal/privacy" target="_blank" rel="noopener">Privacy</a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--cds-layer);
  border-top: 1px solid var(--cds-border-subtle);
  padding: 16px 0;
  margin-top: 48px;
}

.app-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 4%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: var(--cds-text-secondary);
}

.app-footer__links {
  display: flex;
  gap: 24px;
}

.app-footer__links a {
  color: var(--cds-link-primary);
  text-decoration: none;
}

.app-footer__links a:hover {
  text-decoration: underline;
}
</style>
