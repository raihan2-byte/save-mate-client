<template>
  <div class="relative min-h-screen bg-slate-950 overflow-x-hidden text-white">
    <!-- Blob glows -->
    <div class="pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[180px] rounded-full" />
    <div class="pointer-events-none absolute top-40 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[180px] rounded-full" />
    <!-- Grid overlay -->
    <div class="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:60px_60px]" />

    <div class="relative z-10">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <FoundationSection />
      <BudgetTypeSection />
      <TestimonialSection />
      <CTASection />
      <LandingFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import LandingNavbar from '@/components/landing/LandingNavbar.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturesSection from '@/components/landing/FeaturesSection.vue'
import FoundationSection from '@/components/landing/FoundationSection.vue'
import BudgetTypeSection from '@/components/landing/BudgetTypeSection.vue'
import TestimonialSection from '@/components/landing/TestimonialSection.vue'
import CTASection from '@/components/landing/CTASection.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
</script>
