<script lang="ts">
  import { Logo } from '@immich/ui';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
  <Logo variant="icon" size="giant" />

  <div class="checkmark-container">
    <svg class="checkmark" viewBox="0 0 52 52">
      <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
      <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
    </svg>
  </div>

  <h1 class="text-3xl font-bold">Thank you!</h1>
  <p class="text-gray-500">Your responses have been recorded.</p>
</div>

<style>
  .checkmark-container {
    width: 80px;
    height: 80px;
  }

  .checkmark {
    width: 100%;
    height: 100%;
  }

  .checkmark-circle {
    stroke: rgb(var(--immich-primary));
    stroke-width: 2;
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    animation: stroke 600ms cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark-check {
    stroke: rgb(var(--immich-primary));
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: stroke 300ms cubic-bezier(0.65, 0, 0.45, 1) 400ms forwards;
  }

  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }
</style>
