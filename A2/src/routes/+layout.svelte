<!-- defines title and metadata and renders -->
<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title> MTGDECKCOMPANION </title>
	<meta name="MTGDECKCOMPANION" content="MTGDECKCOMPANION"/>
</svelte:head>


{@render children()}
